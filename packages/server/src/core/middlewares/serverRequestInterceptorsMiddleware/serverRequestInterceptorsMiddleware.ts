import type { Express } from 'express';

import type { Interceptor } from '@/utils/types';

import { asyncHandler, callRequestInterceptors } from '@/utils/helpers';

interface ServerRequestInterceptorsMiddlewareParams {
  interceptors: Interceptor[];
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
        interceptors
      });

      return next();
    })
  );
};
