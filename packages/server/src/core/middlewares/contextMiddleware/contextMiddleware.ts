import type { Express } from 'express';
import type { IncomingMessage } from 'node:http';
import type { WebSocketServer } from 'ws';

import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';

import type { ApiContext, DatabaseConfig, GraphQLOperationType, RestMethod } from '@/utils/types';

import { createOrm, createStorage } from '@/core/database';
import { getGraphQLInput, parseCookie, parseGraphQLQuery, parseQuery } from '@/utils/helpers';

export interface RequestContext {
  orm: Partial<ReturnType<typeof createOrm>>;
  broadcast: (data: unknown) => void;
}

declare module 'http' {
  interface IncomingMessage {
    api: ApiContext;
    context: RequestContext;
    cookies: Record<string, string>;
    id: number;
    queries: Record<string, string | string[]>;
    timestamp: number;
  }
}

export const contextMiddleware = (
  server: Express,
  { database, ws }: { database?: DatabaseConfig; ws: WebSocketServer }
) => {
  const broadcast = (data: unknown) => {
    if (data === undefined) return;

    for (const client of ws.clients) {
      if (client.readyState !== WebSocket.OPEN) continue;

      if (typeof data === 'string') {
        client.send(data);
        continue;
      }

      const isBinary =
        data instanceof ArrayBuffer ||
        ArrayBuffer.isView(data) ||
        data instanceof Blob ||
        Buffer.isBuffer(data);
      if (isBinary) {
        client.send(data);
        continue;
      }

      client.send(JSON.stringify(data));
    }
  };

  let requestId = 0;
  const context: RequestContext = {
    orm: {},
    broadcast: (payload: unknown) => broadcast(payload)
  };

  if (database) {
    const storage = createStorage(database.data);
    const orm = createOrm(storage);
    context.orm = orm;
  }

  const addContext = (request: IncomingMessage) => {
    requestId += 1;
    request.id = requestId;
    request.timestamp = Date.now();
    request.context = context;
  };

  server.use((request, _response, next) => {
    addContext(request);

    request.queries = request.query as Record<string, string | string[]>;

    if (request.method === 'GET' || request.method === 'POST') {
      const graphQLInput = getGraphQLInput(request);
      const graphQLQuery = parseGraphQLQuery(graphQLInput.query ?? '');

      request.api = {
        type: 'rest',
        method: request.method.toLowerCase() as RestMethod
      };

      if (graphQLInput.query && graphQLQuery) {
        request.api = {
          type: 'graphql',
          operationType: graphQLQuery.operationType as GraphQLOperationType,
          operationName: graphQLQuery.operationName,
          query: graphQLInput.query,
          variables: graphQLInput.variables
        };
      }
    }

    request.context = context;
    return next();
  });

  ws.on('connection', (socket, request) => {
    addContext(request);

    request.queries = parseQuery(request.url ?? '');
    request.cookies = parseCookie(request.headers.cookie ?? '');

    socket.on('message', () => {
      addContext(request);
    });
    socket.on('close', () => {
      addContext(request);
    });
    socket.on('error', () => {
      addContext(request);
    });
  });
};
