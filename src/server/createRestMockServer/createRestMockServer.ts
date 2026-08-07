import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';

import type { RestMockServerConfig } from '@/utils/types';

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
import { validateApiMockServerConfig } from '@/utils/validate';

export const createRestMockServer = (
  restMockServerConfig: Omit<RestMockServerConfig, 'port'>,
  server: Express = express()
) => {
  validateApiMockServerConfig(restMockServerConfig, 'rest');
  const { cors, staticPath, configs, database, interceptors } = restMockServerConfig;

  server.use(bodyParser.urlencoded({ extended: false }));

  server.use(bodyParser.json({ limit: '10mb' }));
  server.set('json spaces', 2);

  server.use(bodyParser.text());

  contextMiddleware(server, restMockServerConfig);

  cookieParseMiddleware(server);

  const serverRequestInterceptor = restMockServerConfig.interceptors?.request;
  if (serverRequestInterceptor) {
    requestInterceptorMiddleware({ server, interceptor: serverRequestInterceptor });
  }

  const baseUrl = restMockServerConfig.baseUrl ?? '/';

  if (cors) {
    corsMiddleware(server, cors);
  } else {
    noCorsMiddleware(server);
  }

  if (staticPath) {
    staticMiddleware(server, baseUrl, staticPath);
  }

  const routerWithRestRoutes = createRestRoutes({
    router: express.Router(),
    restConfig: { configs: configs ?? [] },
    serverResponseInterceptor: interceptors?.response
  });

  server.use(baseUrl, routerWithRestRoutes);

  if (database) {
    const routerWithDatabaseRoutes = createDatabaseRoutes(express.Router(), database);
    server.use(baseUrl, routerWithDatabaseRoutes);
  }

  errorMiddleware(server);

  return server;
};
