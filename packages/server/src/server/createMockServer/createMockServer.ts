import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';
import { WebSocketServer } from 'ws';

import type {
  BaseUrl,
  GraphQLRequestArtifact,
  MockServerComponent,
  MockServerConfig,
  RestRequestArtifact,
  WsRequestArtifact
} from '@/utils/types';

import { createDatabaseRoutes } from '@/core/database';
import {
  calculateGraphQLRouteConfigWeight,
  createGraphQLRoute,
  prepareGraphQLRequestArtifacts
} from '@/core/graphql';
import {
  contextMiddleware,
  cookieParseMiddleware,
  corsMiddleware,
  errorMiddleware,
  noCorsMiddleware,
  serverRequestInterceptorsMiddleware,
  staticMiddleware
} from '@/core/middlewares';
import {
  calculateRestRouteConfigWeight,
  createRestRoute,
  prepareRestRequestArtifacts
} from '@/core/rest';
import {
  calculateGraphqlTransportWsRouteConfigWeight,
  createWsRoute,
  prepareWsRequestArtifacts
} from '@/core/ws';
import { urlJoin } from '@/utils/helpers';
import { validateMockServerConfig } from '@/utils/validate';

export const createMockServer = (
  mockServerConfig: MockServerConfig,
  server: Express = express()
) => {
  validateMockServerConfig(mockServerConfig);

  const ws = new WebSocketServer({
    noServer: true
  });

  const [option, ...mockServerComponents] = mockServerConfig;

  const mockServerSettings = !('configs' in option) ? option : undefined;
  const {
    cors,
    staticPath,
    interceptors: serverInterceptors,
    baseUrl: serverBaseUrl = '/',
    database
  } = mockServerSettings ?? {};

  server.use(bodyParser.urlencoded({ extended: false }));

  server.use(bodyParser.json({ limit: '10mb' }));
  server.set('json spaces', 2);

  server.use(bodyParser.text());

  contextMiddleware(server, { database, ws });

  cookieParseMiddleware(server);

  if (serverInterceptors) {
    serverRequestInterceptorsMiddleware({
      server,
      interceptors: serverInterceptors
    });
  }

  if (cors) {
    corsMiddleware(server, cors);
  } else {
    noCorsMiddleware(server);
  }

  if (staticPath) {
    staticMiddleware(server, serverBaseUrl, staticPath);
  }

  if (database) {
    const routerWithDatabaseRoutes = createDatabaseRoutes(express.Router(), database);
    server.use(serverBaseUrl, routerWithDatabaseRoutes);
  }

  const components = mockServerSettings
    ? mockServerComponents
    : (mockServerConfig as MockServerComponent[]);

  const { restRequestArtifacts, graphQLRequestArtifacts, wsRequestArtifacts } = components.reduce(
    (acc, component) => {
      component.configs.forEach((config) => {
        const isRest = 'method' in config;
        if (isRest) {
          config.routes.forEach((route) => {
            acc.restRequestArtifacts.push({
              baseUrl: urlJoin(serverBaseUrl ?? '/', component.baseUrl ?? '') as BaseUrl,
              method: config.method,
              path: config.path,
              config: route,
              weight: calculateRestRouteConfigWeight(route),
              serverInterceptors,
              componentInterceptors: component.interceptors
            });
          });
        }

        const isGraphql = 'operationType' in config && config.operationType !== 'subscription';
        if (isGraphql) {
          config.routes.forEach((route) => {
            acc.graphQLRequestArtifacts.push({
              baseUrl: urlJoin(serverBaseUrl ?? '/', component.baseUrl ?? '') as BaseUrl,
              operationType: config.operationType,
              identifier: config.identifier,
              config: route,
              weight: calculateGraphQLRouteConfigWeight(route),
              serverInterceptors,
              componentInterceptors: component.interceptors
            });
          });
        }

        const isGraphqlSubscription =
          'operationType' in config && config.operationType === 'subscription';
        if (isGraphqlSubscription) {
          config.routes.forEach((route) => {
            acc.wsRequestArtifacts.push({
              type: 'graphql-ws',
              baseUrl: urlJoin(serverBaseUrl ?? '/', component.baseUrl ?? '') as BaseUrl,
              weight: calculateGraphqlTransportWsRouteConfigWeight(route),
              operationType: config.operationType,
              identifier: config.identifier,
              config: route
            });
          });
        }

        const isWs = 'type' in config;
        if (isWs) {
          const baseUrl = urlJoin(serverBaseUrl ?? '/', component.baseUrl ?? '') as BaseUrl;
          config.routes.forEach((route) => {
            acc.wsRequestArtifacts.push({
              baseUrl,
              type: config.type,
              config: route,
              weight: 0,
              componentInterceptors: component.interceptors
            } as WsRequestArtifact);
          });
        }
      });

      return acc;
    },
    {
      restRequestArtifacts: [] as RestRequestArtifact[],
      graphQLRequestArtifacts: [] as GraphQLRequestArtifact[],
      wsRequestArtifacts: [] as WsRequestArtifact[]
    }
  );

  const wsBaseUrls = new Set<string>(wsRequestArtifacts.map((artifact) => artifact.baseUrl));
  const originalListen = server.listen.bind(server);
  server.listen = ((...args: any[]) => {
    const httpServer = originalListen(...args);
    httpServer.on('upgrade', (request, socket, head) => {
      // TODO: call request
      const [requestPathname] = request.url!.split('?');
      const shouldHandleUpgrade = [...wsBaseUrls].some((baseUrl) => {
        if (baseUrl === '/') return true;
        return requestPathname === baseUrl || requestPathname.startsWith(`${baseUrl}/`);
      });

      if (!shouldHandleUpgrade) {
        socket.destroy();
        return;
      }

      ws.handleUpgrade(request, socket, head, (upgradedSocket) => {
        ws.emit('connection', upgradedSocket, request);
      });
    });
    return httpServer;
  }) as typeof server.listen;

  if (restRequestArtifacts.length) {
    createRestRoute({
      server,
      restRequestArtifacts: prepareRestRequestArtifacts(restRequestArtifacts)
    });
  }

  if (graphQLRequestArtifacts.length) {
    createGraphQLRoute({
      server,
      graphQLRequestArtifacts: prepareGraphQLRequestArtifacts(graphQLRequestArtifacts)
    });
  }

  if (wsRequestArtifacts.length) {
    createWsRoute({
      server: ws,
      wsRequestArtifacts: prepareWsRequestArtifacts(wsRequestArtifacts)
    });
  }

  errorMiddleware(server);

  return server;
};
