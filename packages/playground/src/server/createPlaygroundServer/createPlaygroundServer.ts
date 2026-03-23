import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';

import type { PlaygroundServerConfig } from '@/utils/types';

import {
  cookieParseMiddleware,
  corsMiddleware,
  errorMiddleware,
  noCorsMiddleware,
  staticMiddleware
} from '@/shared/middlewares';
import { createDatabaseRoutes } from '@/core/createDatabaseRoutes';

export const createPlaygroundServer = (
  playgroundServerConfig: Omit<PlaygroundServerConfig, 'port'>,
  server: Express = express()
) => {
  const { data, routes, cors, staticPath } = playgroundServerConfig;

  server.use(bodyParser.urlencoded({ extended: false }));

  server.use(bodyParser.json({ limit: '10mb' }));
  server.set('json spaces', 2);

  server.use(bodyParser.text());

  cookieParseMiddleware(server);

  const baseUrl = playgroundServerConfig.baseUrl ?? '/';

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
