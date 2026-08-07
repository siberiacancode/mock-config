import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';

import type { DatabaseMockServerConfig } from '@/utils/types';

import { cookieParseMiddleware, errorMiddleware, noCorsMiddleware } from '@/core/middlewares';
import { createDatabaseRoutes } from '@/core/playground';

export const createPlaygroundServer = (
  databaseMockServerConfig: Omit<DatabaseMockServerConfig, 'port'>,
  server: Express = express()
) => {
  const { data, routes } = databaseMockServerConfig;

  server.use(bodyParser.urlencoded({ extended: false }));

  server.use(bodyParser.json({ limit: '10mb' }));
  server.set('json spaces', 2);

  server.use(bodyParser.text());

  cookieParseMiddleware(server);

  const baseUrl = databaseMockServerConfig.baseUrl ?? '/';

  noCorsMiddleware(server);

  const routerWithDatabaseRoutes = createDatabaseRoutes(express.Router(), { data, routes });
  server.use(baseUrl, routerWithDatabaseRoutes);

  errorMiddleware(server);

  return server;
};
