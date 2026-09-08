import type { Request } from 'express';

import type {
  HttpInterceptorMeta,
  HttpRequestInterceptor,
  HttpRequestInterceptorHandlerParams,
  Interceptor
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { callRequestLogger } from '../../../logger';
import { sleep } from '../../../sleep';

interface CallHttpRequestInterceptorsParams {
  meta: HttpInterceptorMeta;
  request: Request;
}

export const callHttpRequestInterceptors = async (
  { meta, request }: CallHttpRequestInterceptorsParams,
  interceptors: Interceptor[]
) => {
  const getHeader: HttpRequestInterceptorHandlerParams['getHeader'] = (field) =>
    request.headers[field];
  const getHeaders: HttpRequestInterceptorHandlerParams['getHeaders'] = () => request.headers;

  const getCookie: HttpRequestInterceptorHandlerParams['getCookie'] = (name) =>
    request.cookies[name];

  const log: HttpRequestInterceptorHandlerParams['log'] = (logger) =>
    callRequestLogger({ logger, request });

  const setDelay: HttpRequestInterceptorHandlerParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const requestInterceptorFnParams: HttpRequestInterceptorHandlerParams = {
    request,
    setDelay,
    getHeader,
    getHeaders,
    getCookie,
    log
  };

  const interceptorNames = [
    'http.request.all',
    ...(meta.type === 'rest' ? ['rest.request.all', `rest.request.${meta.method}`] : []),
    ...(meta.type === 'graphql'
      ? ['graphql.request.all', `graphql.request.${meta.operationType}`]
      : [])
  ];

  const requestInterceptors = interceptors.filter(
    (interceptor): interceptor is HttpRequestInterceptor =>
      interceptorNames.includes(interceptor[INTERCEPTOR_NAME])
  );

  for (const requestInterceptor of requestInterceptors) {
    await requestInterceptor(requestInterceptorFnParams);
  }
};
