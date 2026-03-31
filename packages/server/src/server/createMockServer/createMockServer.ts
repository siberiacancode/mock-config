import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';
import { createGraphQLRoute } from 'src/core/graphql';
import { createRestRoute } from 'src/core/rest';
import { createWsRoute } from 'src/core/ws';

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
  contextMiddleware,
  cookieParseMiddleware,
  corsMiddleware,
  errorMiddleware,
  noCorsMiddleware,
  requestInterceptorMiddleware,
  staticMiddleware
} from '@/core/middlewares';
import { urlJoin } from '@/utils/helpers';
import { WS_MESSAGE_EVENT } from '@/utils/types';
import { validateMockServerConfig } from '@/utils/validate';

import { calculateGraphQLRouteConfigWeight } from '../../core/graphql/createGraphQLRoute/helpers';
import { calculateRestRouteConfigWeight } from '../../core/rest/createRestRoute/helpers';
import { calculateWsRouteConfigWeight } from '../../core/ws/createWsRoute/helpers';

const getWsArtifactEventKey = (event: WsRequestArtifact['event']) => {
  if (event === WS_MESSAGE_EVENT) return 'message';
  return String(event);
};

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
                key: `${serverBaseUrl}${component.baseUrl}/${config.method}/${config.path}`,
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

          const isGraphql = 'operationType' in config;
          if (isGraphql) {
            config.routes.forEach((route) => {
              acc.graphQLRequestsArtifacts.push({
                key: `${serverBaseUrl}${component.baseUrl}/${config.operationType}/${
                  'operationName' in config ? config.operationName : config.query
                }`,
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

          const isWs = 'event' in config;
          if (isWs) {
            config.routes.forEach((route) => {
              acc.wsRequestsArtifacts.push({
                key: `${serverBaseUrl}${
                  component.baseUrl
                }/ws/${getWsArtifactEventKey(config.event)}`,
                baseUrl: urlJoin(serverBaseUrl ?? '/', component.baseUrl ?? '') as BaseUrl,
                event: config.event,
                config: route,
                weight: calculateWsRouteConfigWeight(route),
                componentRequestInterceptor: component.interceptors?.request as any,
                componentResponseInterceptor: component.interceptors?.response as any
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

  const sortedRestRequestsArtifacts = restRequestsArtifacts.toSorted(
    (first, second) => second.weight - first.weight
  );
  const sortedGraphQLRequestsArtifacts = graphQLRequestsArtifacts.toSorted(
    (first, second) => second.weight - first.weight
  );
  const sortedWsRequestsArtifacts = wsRequestsArtifacts.toSorted(
    (first, second) => second.weight - first.weight
  );

  if (sortedRestRequestsArtifacts.length) {
    createRestRoute({
      server,
      restRequestArtifacts: sortedRestRequestsArtifacts
    });
  }

  if (sortedGraphQLRequestsArtifacts.length) {
    createGraphQLRoute({
      server,
      graphQLRequestArtifacts: sortedGraphQLRequestsArtifacts
    });
  }

  if (sortedWsRequestsArtifacts.length) {
    createWsRoute({
      server,
      wsRequestArtifacts: sortedWsRequestsArtifacts
    });
  }

  errorMiddleware(server);

  return server;
};
