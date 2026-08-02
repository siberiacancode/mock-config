import type { Express } from 'express';
import type { RawData } from 'ws';

import bodyParser from 'body-parser';
import express from 'express';
import { WebSocketServer } from 'ws';

import type {
  BaseUrl,
  GraphQLRequestArtifact,
  MockServerComponent,
  MockServerConfig,
  RestRequestArtifact,
  WsFrame,
  WsInterceptorMeta,
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
  addTaskInWsQueue,
  broadcastWsData,
  calculateGraphqlTransportWsRouteConfigWeight,
  calculateWsRouteConfigWeight,
  createWsFrame,
  createWsRoute,
  prepareWsRequestArtifacts,
  sendWsData
} from '@/core/ws';
import { callWsRequestInterceptors, getGraphqlTransportWsInput, urlJoin } from '@/utils/helpers';
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
              baseUrl: urlJoin(serverBaseUrl, component.baseUrl ?? '') as BaseUrl,
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
              baseUrl: urlJoin(serverBaseUrl, component.baseUrl ?? '') as BaseUrl,
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
              baseUrl: urlJoin(serverBaseUrl, component.baseUrl ?? '') as BaseUrl,
              weight: calculateGraphqlTransportWsRouteConfigWeight(route),
              operationType: config.operationType,
              identifier: config.identifier,
              config: route,
              serverInterceptors,
              componentInterceptors: component.interceptors
            });
          });
        }

        const isWs = 'type' in config;
        if (isWs) {
          const baseUrl = urlJoin(serverBaseUrl, component.baseUrl ?? '') as BaseUrl;
          config.routes.forEach((route) => {
            acc.wsRequestArtifacts.push({
              baseUrl,
              type: config.type,
              config: route,
              weight: calculateWsRouteConfigWeight(route),
              serverInterceptors,
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
  server.listen = ((...args: Parameters<typeof originalListen>) => {
    const httpServer = originalListen(...args);
    httpServer.on('upgrade', async (request, socket, head) => {
      // if (serverInterceptors) {
      //   const broadcast = (data: unknown) => broadcastWsData(server, data);
      //   const send = (data: unknown) => sendWsData(socket, data);
      //
      //   await callWsRequestInterceptors({
      //     meta: {
      //       type: 'ws',
      //       event: 'open'
      //     },
      //     interceptors: serverInterceptors,
      //     socket,
      //     broadcast,
      //     send
      //   });
      // }
      const [requestPathname] = request.url!.split('?');
      const shouldHandleUpgrade = [...wsBaseUrls].some((baseUrl) => {
        if (baseUrl === '/') return true;
        return requestPathname === baseUrl || requestPathname.startsWith(`${baseUrl}/`);
      });

      if (!shouldHandleUpgrade) {
        socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
      }

      ws.handleUpgrade(request, socket, head, (upgradedSocket) => {
        ws.emit('connection', upgradedSocket, request);
      });
    });
    return httpServer;
  }) as typeof server.listen;

  if (serverInterceptors?.length) {
    ws.on('connection', async (socket) => {
      const broadcast = (data: unknown) => broadcastWsData(ws, data);
      const send = (data: unknown) => sendWsData(socket, data);

      const callServerRequestInterceptors = (meta: WsInterceptorMeta, frame?: WsFrame) =>
        addTaskInWsQueue(socket, () =>
          callWsRequestInterceptors({
            meta,
            frame,
            interceptors: serverInterceptors,
            socket,
            broadcast,
            send
          })
        );

      socket.on('message', async (raw: RawData, isBinary: boolean) => {
        const graphqlTransportWsInput = isBinary
          ? undefined
          : getGraphqlTransportWsInput(raw.toString());

        await callServerRequestInterceptors(
          {
            type: 'ws',
            event: 'message',
            messageType: graphqlTransportWsInput ? 'graphql-ws' : 'raw'
          },
          createWsFrame(raw, isBinary)
        );
      });

      socket.on('close', () => callServerRequestInterceptors({ type: 'ws', event: 'close' }));
      socket.on('error', () => callServerRequestInterceptors({ type: 'ws', event: 'error' }));

      await callServerRequestInterceptors({ type: 'ws', event: 'open' });
    });
  }

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
