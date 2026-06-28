import type { Express } from 'express';

import type { Interceptor } from '@/utils/types';

import { asyncHandler, callHttpRequestInterceptors } from '@/utils/helpers';

interface ServerRequestInterceptorsMiddlewareParams {
  interceptors: Interceptor[];
  path?: string;
  server: Express;
}

export const serverRequestInterceptorsMiddleware = ({
  server,
  path = '*',
  interceptors
}: ServerRequestInterceptorsMiddlewareParams) =>
  server.use(
    path,
    asyncHandler(async (request, _response, next) => {
      if (request.api.type === 'ws') return next();

      await callHttpRequestInterceptors({
        request,
        interceptors,
        meta:
          request.api.type === 'rest'
            ? {
                type: request.api.type,
                method: request.api.method
              }
            : {
                type: request.api.type,
                operationType: request.api.operationType
              }
      });

      return next();
    })
  );
