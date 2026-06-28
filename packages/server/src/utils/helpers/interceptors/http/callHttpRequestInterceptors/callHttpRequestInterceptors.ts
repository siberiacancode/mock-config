import type { Request } from 'express';

import type {
  HttpInterceptorMeta,
  HttpRequestInterceptor,
  HttpRequestInterceptorFnParams,
  Interceptor
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { callRequestLogger } from '../../../logger';
import { sleep } from '../../../sleep';

interface CallHttpRequestInterceptorsParams {
  interceptors: Interceptor[];
  meta: HttpInterceptorMeta;
  request: Request;
}

export const callHttpRequestInterceptors = async ({
  interceptors,
  meta,
  request
}: CallHttpRequestInterceptorsParams) => {
  const getHeader: HttpRequestInterceptorFnParams['getHeader'] = (field) => request.headers[field];
  const getHeaders: HttpRequestInterceptorFnParams['getHeaders'] = () => request.headers;

  const getCookie: HttpRequestInterceptorFnParams['getCookie'] = (name) => request.cookies[name];

  const log: HttpRequestInterceptorFnParams['log'] = (logger) =>
    callRequestLogger({ logger, request });

  const setDelay: HttpRequestInterceptorFnParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const requestInterceptorFnParams: HttpRequestInterceptorFnParams = {
    request,
    setDelay,
    getHeader,
    getHeaders,
    getCookie,
    log,
    orm: request.context.orm
  };

  const interceptorNames =
    meta.type === 'graphql'
      ? ['http.request.all', 'graphql.request.all', `graphql.request.${meta.operationType}`]
      : ['http.request.all', 'rest.request.all', `rest.request.${meta.method}`];

  const requestInterceptors = interceptors.filter(
    (interceptor): interceptor is HttpRequestInterceptor =>
      interceptorNames.includes((interceptor as HttpRequestInterceptor)[INTERCEPTOR_NAME])
  );

  for (const requestInterceptor of requestInterceptors) {
    await requestInterceptor(requestInterceptorFnParams);
  }
};
