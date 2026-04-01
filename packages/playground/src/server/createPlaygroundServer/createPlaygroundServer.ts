import { createNodeApp, createNodeRouter } from 'mock-config-http';

import type { PlaygroundServerConfig } from '@/utils/types';

import { createDatabaseRoutes } from '@/core/createDatabaseRoutes';
import {
  cookieParseMiddleware,
  corsMiddleware,
  errorMiddleware,
  noCorsMiddleware,
  staticMiddleware
} from 'mock-config-http';

export const createPlaygroundServer = (
  playgroundServerConfig: PlaygroundServerConfig
) => {
  const server = createNodeApp();
  const { data, routes, cors, staticPath } = playgroundServerConfig;

  cookieParseMiddleware(server);

  const baseUrl = playgroundServerConfig.baseUrl ?? '/';

  if (cors) {
    corsMiddleware(server, cors);
  } else {
    noCorsMiddleware(server);
  }

  if (staticPath) {
    staticMiddleware(server, baseUrl, staticPath, process.cwd());
  }

  const routerWithDatabaseRoutes = createDatabaseRoutes(createNodeRouter(), { data, routes });
  server.use(baseUrl, routerWithDatabaseRoutes);

  errorMiddleware(server);

  return server;
};
