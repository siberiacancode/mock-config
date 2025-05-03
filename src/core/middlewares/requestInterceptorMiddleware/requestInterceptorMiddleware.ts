import type { Express } from 'express';

import type { RequestInterceptor } from '@/utils/types';

import { callRequestInterceptor } from '@/core/interceptors';
import { asyncHandler } from '@/utils/helpers';

interface RequestInterceptorMiddlewareParams {
  interceptor: RequestInterceptor;
  path?: string;
  server: Express;
}

export const requestInterceptorMiddleware = ({
  server,
  path = '*',
  interceptor
}: RequestInterceptorMiddlewareParams) => {
  server.use(
    path,
    asyncHandler(async (request, _response, next) => {
      await callRequestInterceptor({ request, interceptor });
      return next();
    })
  );
};
