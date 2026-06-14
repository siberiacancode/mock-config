import type { Express } from 'express';

import type { Interceptors, RestMethod } from '@/utils/types';

import { asyncHandler, callRequestInterceptors } from '@/utils/helpers';

interface ServerRequestInterceptorsMiddlewareParams {
  interceptors: Interceptors;
  path?: string;
  server: Express;
}

export const serverRequestInterceptorsMiddleware = ({
  server,
  path = '*',
  interceptors
}: ServerRequestInterceptorsMiddlewareParams) => {
  server.use(
    path,
    asyncHandler(async (request, _response, next) => {
      await callRequestInterceptors({
        request,
        interceptors,
        interceptorNames: request.graphQL
          ? [
              'http.request.all',
              'graphql.request.all',
              `graphql.request.${request.graphQL.operationType}`
            ]
          : [
              'http.request.all',
              'rest.request.all',
              `rest.request.${request.method.toLowerCase() as RestMethod}`
            ]
      });

      return next();
    })
  );
};
