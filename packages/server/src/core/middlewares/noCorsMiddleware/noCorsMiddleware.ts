import type { Express } from 'express';

import { DEFAULT } from '@/utils/constants';

export const noCorsMiddleware = (server: Express) => {
  server.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', DEFAULT.CORS.ORIGIN);
    response.setHeader('Access-Control-Allow-Credentials', `${DEFAULT.CORS.CREDENTIALS}`);
    response.setHeader('Access-Control-Expose-Headers', DEFAULT.CORS.EXPOSED_HEADERS);

    const isPreflightRequest =
      request.method === 'OPTIONS' &&
      request.headers.origin &&
      request.headers['access-control-request-method'] &&
      request.headers['access-control-request-headers'];

    if (isPreflightRequest) {
      response.setHeader('Access-Control-Allow-Methods', DEFAULT.CORS.METHODS);
      response.setHeader('Access-Control-Allow-Headers', DEFAULT.CORS.ALLOWED_HEADERS);
      response.setHeader('Access-Control-Max-Age', DEFAULT.CORS.MAX_AGE);
      response.sendStatus(204);
      return response.end();
    }

    return next();
  });
};
