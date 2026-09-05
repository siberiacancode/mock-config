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
  interceptors: Interceptor[];
  meta: HttpInterceptorMeta;
  request: Request;
}

export const callHttpRequestInterceptors = async ({
  interceptors,
  meta,
  request
}: CallHttpRequestInterceptorsParams) => {
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

  const interceptorNames =
    meta.type === 'graphql'
      ? ['http.request.all', 'graphql.request.all', `graphql.request.${meta.operationType}`]
      : ['http.request.all', 'rest.request.all', `rest.request.${meta.method}`];

  const requestInterceptors = interceptors.filter(
    (interceptor): interceptor is HttpRequestInterceptor =>
      interceptorNames.includes(interceptor[INTERCEPTOR_NAME])
  );

  for (const requestInterceptor of requestInterceptors) {
    await requestInterceptor(requestInterceptorFnParams);
  }
};
