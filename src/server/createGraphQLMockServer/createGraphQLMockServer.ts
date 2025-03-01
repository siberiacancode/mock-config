import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';

import type { GraphQLMockServerConfig } from '@/utils/types';

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
import { validateApiMockServerConfig } from '@/utils/validate';

export const createGraphQLMockServer = (
  graphqlMockServerConfig: Omit<GraphQLMockServerConfig, 'port'>,
  server: Express = express()
) => {
  validateApiMockServerConfig(graphqlMockServerConfig, 'graphql');
  const { cors, staticPath, configs, database, interceptors } = graphqlMockServerConfig;

  server.use(bodyParser.urlencoded({ extended: false }));

  server.use(bodyParser.json({ limit: '10mb' }));
  server.set('json spaces', 2);

  server.use(bodyParser.text());

  contextMiddleware(server, graphqlMockServerConfig);

  cookieParseMiddleware(server);

  const serverRequestInterceptor = graphqlMockServerConfig.interceptors?.request;
  if (serverRequestInterceptor) {
    requestInterceptorMiddleware({ server, interceptor: serverRequestInterceptor });
  }

  const baseUrl = graphqlMockServerConfig.baseUrl ?? '/';

  if (cors) {
    corsMiddleware(server, cors);
  } else {
    noCorsMiddleware(server);
  }

  if (staticPath) {
    staticMiddleware(server, baseUrl, staticPath);
  }

  const routerWithGraphqlRoutes = createGraphQLRoutes({
    router: express.Router(),
    graphqlConfig: { configs: configs ?? [] },
    serverResponseInterceptor: interceptors?.response
  });

  server.use(baseUrl, routerWithGraphqlRoutes);

  if (database) {
    const routerWithDatabaseRoutes = createDatabaseRoutes(express.Router(), database);
    server.use(baseUrl, routerWithDatabaseRoutes);
  }

  errorMiddleware(server);

  return server;
};
