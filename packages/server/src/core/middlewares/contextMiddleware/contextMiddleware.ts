import type { Express } from 'express';
import type { WebSocketServer } from 'ws';

import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';

import type { GraphQLEntity, GraphQLOperationName, GraphQLOperationType } from '@/utils/types';

import { getGraphQLInput, parseGraphQLQuery } from '@/utils/helpers';

declare global {
  namespace Express {
    export interface Request {
      graphQL: {
        operationType: GraphQLOperationType;
        operationName?: GraphQLOperationName;
        query: string;
        variables?: GraphQLEntity<'variables'>;
      } | null;
      id: number;
      timestamp: number;
    }
  }
}

export const contextMiddleware = (server: Express, { ws }: { ws: WebSocketServer }) => {
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
    broadcast: (payload: unknown) => broadcast(payload)
  };

  server.use((request, _response, next) => {
    requestId += 1;
    request.id = requestId;

    request.timestamp = Date.now();

    request.graphQL = null;
    if (request.method === 'GET' || request.method === 'POST') {
      const graphQLInput = getGraphQLInput(request);
      const graphQLQuery = parseGraphQLQuery(graphQLInput.query ?? '');

      if (graphQLInput.query && graphQLQuery) {
        request.graphQL = {
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
};
