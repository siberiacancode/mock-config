import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';

import type { DatabaseMockServerConfig } from '@/utils/types';

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

export const createDatabaseMockServer = (
  databaseMockServerConfig: Omit<DatabaseMockServerConfig, 'port'>,
  server: Express = express()
) => {
  const { cors, staticPath, data, routes } = databaseMockServerConfig;

  server.use(bodyParser.urlencoded({ extended: false }));

  server.use(bodyParser.json({ limit: '10mb' }));
  server.set('json spaces', 2);

  server.use(bodyParser.text());

  contextMiddleware(server, { database: { data, routes } });

  cookieParseMiddleware(server);

  const serverRequestInterceptor = databaseMockServerConfig.interceptors?.request;
  if (serverRequestInterceptor) {
    requestInterceptorMiddleware({ server, interceptor: serverRequestInterceptor });
  }

  const baseUrl = databaseMockServerConfig.baseUrl ?? '/';

  if (cors) {
    corsMiddleware(server, cors);
  } else {
    noCorsMiddleware(server);
  }

  if (staticPath) {
    staticMiddleware(server, baseUrl, staticPath);
  }

  const routerWithDatabaseRoutes = createDatabaseRoutes(express.Router(), { data, routes });
  server.use(baseUrl, routerWithDatabaseRoutes);

  errorMiddleware(server);

  return server;
};
