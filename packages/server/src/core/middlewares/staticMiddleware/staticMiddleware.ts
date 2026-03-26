import type { Express } from 'express';

import express from 'express';

import type { BaseUrl, StaticPath } from '@/utils/types';

import { APP_PATH } from '@/utils/constants';
import { urlJoin } from '@/utils/helpers';

export const staticMiddleware = (server: Express, baseUrl: BaseUrl, staticPath: StaticPath) => {
  const isStaticPathArray = Array.isArray(staticPath);

  if (isStaticPathArray) {
    staticPath.forEach((staticPath) => {
      const isPathObject = typeof staticPath === 'object';
      if (isPathObject) {
        server.use(
          urlJoin(baseUrl, staticPath.prefix),
          express.static(urlJoin(APP_PATH, staticPath.path))
        );
        return;
      }
      server.use(baseUrl, express.static(urlJoin(APP_PATH, staticPath)));
    });

    return;
  }

  const isStaticPathObject = typeof staticPath === 'object';
  if (isStaticPathObject) {
    server.use(
      urlJoin(baseUrl, staticPath.prefix),
      express.static(urlJoin(APP_PATH, staticPath.path))
    );
    return;
  }

  server.use(baseUrl, express.static(urlJoin(APP_PATH, staticPath)));
};
