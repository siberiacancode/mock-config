import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';

import type { MockServerConfig } from '@/utils/types';

import { createGraphQLRoutes } from '@/core/graphql';
import {
  contextMiddleware,
  cookieParseMiddleware,
  corsMiddleware,
  errorMiddleware,
  noCorsMiddleware,
  requestInterceptorMiddleware,
  staticMiddleware
} from '@/core/middlewares';
import { createDatabaseRoutes } from '@/core/playground';
import { createRestRoutes } from '@/core/rest';
import { urlJoin } from '@/utils/helpers';
import { validateMockServerConfig } from '@/utils/validate';

export const createMockServer = (
  mockServerConfig: Omit<MockServerConfig, 'port'>,
  server: Express = express()
) => {
  validateMockServerConfig(mockServerConfig);
  const { cors, staticPath, rest, graphql, database, interceptors } = mockServerConfig;

  server.use(bodyParser.urlencoded({ extended: false }));

  server.use(bodyParser.json({ limit: '10mb' }));
  server.set('json spaces', 2);

  server.use(bodyParser.text());

  contextMiddleware(server, mockServerConfig);

  cookieParseMiddleware(server);

  const serverRequestInterceptor = mockServerConfig.interceptors?.request;
  if (serverRequestInterceptor) {
    requestInterceptorMiddleware({ server, interceptor: serverRequestInterceptor });
  }

  const baseUrl = mockServerConfig.baseUrl ?? '/';

  if (cors) {
    corsMiddleware(server, cors);
  } else {
    noCorsMiddleware(server);
  }

  if (staticPath) {
    staticMiddleware(server, baseUrl, staticPath);
  }

  if (rest) {
    const routerWithRestRoutes = createRestRoutes({
      router: express.Router(),
      restConfig: rest,
      serverResponseInterceptor: interceptors?.response
    });

    const restBaseUrl = urlJoin(baseUrl, rest.baseUrl ?? '/');

    const apiRequestInterceptor = rest.interceptors?.request;
    if (apiRequestInterceptor) {
      requestInterceptorMiddleware({
        server,
        path: restBaseUrl,
        interceptor: apiRequestInterceptor
      });
    }

    server.use(restBaseUrl, routerWithRestRoutes);
  }

  if (graphql) {
    const routerWithGraphQLRoutes = createGraphQLRoutes({
      router: express.Router(),
      graphqlConfig: graphql,
      serverResponseInterceptor: interceptors?.response
    });

    const graphqlBaseUrl = urlJoin(baseUrl, graphql.baseUrl ?? '/');

    const apiRequestInterceptor = graphql.interceptors?.request;
    if (apiRequestInterceptor) {
      requestInterceptorMiddleware({
        server,
        path: graphqlBaseUrl,
        interceptor: apiRequestInterceptor
      });
    }

    server.use(graphqlBaseUrl, routerWithGraphQLRoutes);
  }

  if (database) {
    const routerWithDatabaseRoutes = createDatabaseRoutes(express.Router(), database);
    server.use(baseUrl, routerWithDatabaseRoutes);
  }

  errorMiddleware(server);

  return server;
};
