import type { Express } from 'express';
import type { WebSocketServer } from 'ws';

import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';

import type { ApiType, DatabaseConfig, GraphQLEntity, GraphQLOperationType } from '@/utils/types';

import { createOrm, createStorage } from '@/core/database';
import { getGraphQLInput, parseGraphQLQuery } from '@/utils/helpers';

type ApiContext =
  | { type: Exclude<ApiType, 'graphql'>; graphQL: null }
  | {
      type: Extract<ApiType, 'graphql'>;
      graphQL: {
        operationName?: string;
        operationType: GraphQLOperationType;
        query: string;
        variables?: GraphQLEntity<'variables'>;
      };
    };

declare global {
  namespace Express {
    export interface Request {
      api: ApiContext;
      id: number;
      timestamp: number;
    }
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
  const context: Express['request']['context'] = {
    orm: {},
    broadcast: (payload: unknown) => broadcast(payload)
  };

  if (database) {
    const storage = createStorage(database.data);
    const orm = createOrm(storage);
    context.orm = orm;
  }

  const decorate = (request: Express['request']) => {
    requestId += 1;
    request.id = requestId;
    request.timestamp = Date.now();
    request.context = context;
  };

  server.use((request, _response, next) => {
    decorate(request);

    if (request.method === 'GET' || request.method === 'POST') {
      const graphQLInput = getGraphQLInput(request);
      const graphQLQuery = parseGraphQLQuery(graphQLInput.query ?? '');

      request.api = {
        type: 'rest',
        graphQL: null
      };

      if (graphQLInput.query && graphQLQuery) {
        request.api = {
          type: 'graphql',
          graphQL: {
            operationType: graphQLQuery.operationType as GraphQLOperationType,
            operationName: graphQLQuery.operationName,
            query: graphQLInput.query,
            variables: graphQLInput.variables
          }
        };
      }
    }

    request.context = context;
    return next();
  });

  ws.on('connection', (socket, incomingMessage) => {
    const request = incomingMessage as Express['request'];

    const decorateWs = () => {
      decorate(request);
      request.api = { type: 'ws', graphQL: null };
    };

    decorateWs();
    socket.on('message', decorateWs);
    socket.on('ping', decorateWs);
    socket.on('pong', decorateWs);
    socket.on('close', decorateWs);
    socket.on('error', decorateWs);
  });
};
