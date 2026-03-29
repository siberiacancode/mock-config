import type { Express } from 'express';

import { parseCookie } from './helpers';

export const cookieParseMiddleware = (server: Express) => {
  server.use((request, _response, next) => {
    if (request.headers.cookie) {
      request.cookies = parseCookie(request.headers.cookie);
    } else {
      request.cookies = {};
    }
    return next();
  });
};
