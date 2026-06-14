import type { Request } from 'express';

import type {
  Interceptors,
  RequestInterceptor,
  RequestInterceptorFnParams,
  RequestInterceptorName
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { callRequestLogger } from '../../logger';
import { sleep } from '../../sleep';

interface CallRequestInterceptorsParams {
  interceptorNames: RequestInterceptorName[];
  interceptors: Interceptors;
  request: Request;
}

export const callRequestInterceptors = async ({
  interceptorNames,
  interceptors,
  request
}: CallRequestInterceptorsParams) => {
  const getHeader: RequestInterceptorFnParams['getHeader'] = (field) => request.headers[field];
  const getHeaders: RequestInterceptorFnParams['getHeaders'] = () => request.headers;

  const getCookie: RequestInterceptorFnParams['getCookie'] = (name) => request.cookies[name];

  const log: RequestInterceptorFnParams['log'] = (logger) => callRequestLogger({ logger, request });

  const setDelay: RequestInterceptorFnParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const requestInterceptorFnParams: RequestInterceptorFnParams = {
    request,
    setDelay,
    getHeader,
    getHeaders,
    getCookie,
    log,
    orm: request.context.orm
  };

  const requestInterceptors = interceptors.filter(
    (interceptor): interceptor is RequestInterceptor =>
      interceptorNames.includes((interceptor as RequestInterceptor)[INTERCEPTOR_NAME])
  );

  for (const requestInterceptor of requestInterceptors) {
    await requestInterceptor(requestInterceptorFnParams);
  }
};
