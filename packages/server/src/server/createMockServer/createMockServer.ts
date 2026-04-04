import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';

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
  requestInterceptorMiddleware,
  staticMiddleware
} from '@/core/middlewares';
import {
  calculateRestRouteConfigWeight,
  createRestRoute,
  prepareRestRequestArtifacts
} from '@/core/rest';
import {
  calculateGraphQLSubscriptionRouteConfigWeight,
  calculateWsRouteConfigWeight,
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
  const [option, ...mockServerComponents] = mockServerConfig;

  const mockServerSettings = !('configs' in option) ? option : undefined;
  const {
    cors,
    staticPath,
    interceptors,
    baseUrl: serverBaseUrl = '/',
    database
  } = mockServerSettings ?? {};

  server.use(bodyParser.urlencoded({ extended: false }));

  server.use(bodyParser.json({ limit: '10mb' }));
  server.set('json spaces', 2);

  server.use(bodyParser.text());

  contextMiddleware(server, { database });

  cookieParseMiddleware(server);

  const serverRequestInterceptor = interceptors?.request;
  if (serverRequestInterceptor) {
    requestInterceptorMiddleware({
      server,
      interceptor: serverRequestInterceptor
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

  const { restRequestsArtifacts, graphQLRequestsArtifacts, wsRequestsArtifacts } =
    components.reduce(
      (acc, component) => {
        component.configs.forEach((config) => {
          const isRest = 'method' in config;
          if (isRest) {
            config.routes.forEach((route) => {
              acc.restRequestsArtifacts.push({
                baseUrl: urlJoin(serverBaseUrl ?? '/', component.baseUrl ?? '') as BaseUrl,
                method: config.method,
                path: config.path,
                config: route,
                weight: calculateRestRouteConfigWeight(route),
                serverResponseInterceptor: interceptors?.response,
                serverRequestInterceptor: interceptors?.request,
                requestResponseInterceptor: config.interceptors?.response,
                requestRequestInterceptor: config.interceptors?.request,
                componentResponseInterceptor: component.interceptors?.response,
                componentRequestInterceptor: component.interceptors?.request,
                routeResponseInterceptor: route.interceptors?.response,
                routeRequestInterceptor: route.interceptors?.request
              });
            });
          }

          const isGraphql = 'operationType' in config && config.operationType !== 'subscription';
          if (isGraphql) {
            config.routes.forEach((route) => {
              acc.graphQLRequestsArtifacts.push({
                baseUrl: urlJoin(serverBaseUrl ?? '/', component.baseUrl ?? '') as BaseUrl,
                operationType: config.operationType,
                operationName: 'operationName' in config ? config.operationName : undefined,
                query: 'query' in config ? config.query : undefined,
                config: route,
                weight: calculateGraphQLRouteConfigWeight(route),
                serverResponseInterceptor: interceptors?.response,
                serverRequestInterceptor: interceptors?.request,
                requestResponseInterceptor: config.interceptors?.response,
                requestRequestInterceptor: config.interceptors?.request,
                componentResponseInterceptor: component.interceptors?.response,
                componentRequestInterceptor: component.interceptors?.request,
                routeResponseInterceptor: route.interceptors?.response,
                routeRequestInterceptor: route.interceptors?.request
              });
            });
          }

          const isGraphqlSubscription =
            'operationType' in config && config.operationType === 'subscription';
          if (isGraphqlSubscription) {
            config.routes.forEach((route) => {
              acc.wsRequestsArtifacts.push({
                type: 'graphql-ws',
                baseUrl: urlJoin(serverBaseUrl ?? '/', component.baseUrl ?? '') as BaseUrl,
                weight: calculateGraphQLSubscriptionRouteConfigWeight(route),
                operationType: 'subscription',
                operationName: config.operationName,
                query: config.query,
                config: route
              });
            });
          }

          const isWs = 'event' in config;
          if (isWs) {
            config.routes.forEach((route) => {
              acc.wsRequestsArtifacts.push({
                type: 'ws',
                baseUrl: urlJoin(serverBaseUrl ?? '/', component.baseUrl ?? '') as BaseUrl,
                event: config.event,
                config: route,
                weight: calculateWsRouteConfigWeight(route)
              });
            });
          }
        });

        return acc;
      },
      {
        restRequestsArtifacts: [] as RestRequestArtifact[],
        graphQLRequestsArtifacts: [] as GraphQLRequestArtifact[],
        wsRequestsArtifacts: [] as WsRequestArtifact[]
      }
    );

  const preparedRestRequestArtifacts = prepareRestRequestArtifacts(restRequestsArtifacts);
  const preparedGraphQLRequestArtifacts = prepareGraphQLRequestArtifacts(graphQLRequestsArtifacts);
  const preparedWsRequestsArtifacts = prepareWsRequestArtifacts(wsRequestsArtifacts);

  if (preparedRestRequestArtifacts.length) {
    createRestRoute({
      server,
      restRequestArtifacts: preparedRestRequestArtifacts
    });
  }

  if (preparedGraphQLRequestArtifacts.length) {
    createGraphQLRoute({
      server,
      graphQLRequestArtifacts: preparedGraphQLRequestArtifacts
    });
  }

  if (preparedWsRequestsArtifacts.length) {
    createWsRoute({
      server,
      wsRequestArtifacts: preparedWsRequestsArtifacts
    });
  }

  errorMiddleware(server);

  return server;
};
