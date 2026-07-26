import type { Express } from 'express';

import type { Interceptor } from '@/utils/types';

import { asyncHandler, callHttpRequestInterceptors } from '@/utils/helpers';

interface ServerRequestInterceptorsMiddlewareParams {
  interceptors: Interceptor[];
  server: Express;
}

export const serverRequestInterceptorsMiddleware = ({
  server,
  interceptors
}: ServerRequestInterceptorsMiddlewareParams) =>
  server.use(
    '*',
    asyncHandler(async (request) => {
      if (request.api.type === 'rest') {
        await callHttpRequestInterceptors({
          request,
          interceptors,
          meta: {
            type: request.api.type,
            method: request.api.method
          }
        });
      }
      if (request.api.type === 'graphql') {
        await callHttpRequestInterceptors({
          request,
          interceptors,
          meta: {
            type: request.api.type,
            operationType: request.api.operationType
          }
        });
      }
    })
  );
