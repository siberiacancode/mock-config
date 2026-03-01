import type { Express } from 'express';

import type { Cors, CorsOrigin } from '@/utils/types';

import { DEFAULT } from '@/utils/constants';
import { asyncHandler } from '@/utils/helpers';

import { getAllowedOrigins } from './helpers';

export const corsMiddleware = (server: Express, cors: Cors) => {
  server.use(
    asyncHandler(async (request, response, next) => {
      if (Array.isArray(cors.origin) && !cors.origin.length) {
        return next();
      }

      let allowedOrigins: CorsOrigin[] = [];

      if (typeof cors.origin === 'function') {
        const origins = await cors.origin(request);
        allowedOrigins = getAllowedOrigins(origins);
      } else {
        allowedOrigins = getAllowedOrigins(cors.origin);
      }

      const { origin } = request.headers;

      if (!allowedOrigins?.length || !origin) {
        return next();
      }

      const isRequestOriginAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin instanceof RegExp) {
          return new RegExp(allowedOrigin).test(origin);
        }
        return allowedOrigin === origin;
      });

      if (isRequestOriginAllowed) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader(
          'Access-Control-Allow-Credentials',
          `${cors.credentials ?? DEFAULT.CORS.CREDENTIALS}`
        );
        response.setHeader(
          'Access-Control-Expose-Headers',
          cors.exposedHeaders ?? DEFAULT.CORS.EXPOSED_HEADERS
        );

        if (request.method === 'OPTIONS') {
          response.setHeader('Access-Control-Allow-Methods', cors.methods ?? DEFAULT.CORS.METHODS);
          response.setHeader(
            'Access-Control-Allow-Headers',
            cors.allowedHeaders ?? DEFAULT.CORS.ALLOWED_HEADERS
          );
          response.setHeader('Access-Control-Max-Age', cors.maxAge ?? DEFAULT.CORS.MAX_AGE);
          response.sendStatus(204);
          return response.end();
        }
      }

      return next();
    })
  );
};
