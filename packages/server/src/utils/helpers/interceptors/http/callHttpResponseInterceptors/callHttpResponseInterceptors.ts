import type { Request, Response } from 'express';

import type {
  Data,
  HttpInterceptorMeta,
  HttpResponseInterceptor,
  HttpResponseInterceptorHandlerParams,
  Interceptor
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { callResponseLogger } from '../../../logger';
import { sleep } from '../../../sleep';

interface CallHttpResponseInterceptorsParams {
  componentInterceptors?: Interceptor[];
  data: Data;
  meta: HttpInterceptorMeta;
  request: Request;
  response: Response;
  serverInterceptors?: Interceptor[];
}

export const callHttpResponseInterceptors = async ({
  data,
  meta,
  request,
  response,
  componentInterceptors = [],
  serverInterceptors = []
}: CallHttpResponseInterceptorsParams) => {
  const getRequestHeader: HttpResponseInterceptorHandlerParams['getRequestHeader'] = (
    field: string
  ) => request.headers[field];
  const getRequestHeaders: HttpResponseInterceptorHandlerParams['getRequestHeaders'] = () =>
    request.headers;

  const getResponseHeader: HttpResponseInterceptorHandlerParams['getResponseHeader'] = (
    field: string
  ) => response.getHeader(field);
  const getResponseHeaders: HttpResponseInterceptorHandlerParams['getResponseHeaders'] = () =>
    response.getHeaders();

  const setHeader = (field: string, value?: string | string[]) => {
    response.set(field, value);
  };
  const appendHeader: HttpResponseInterceptorHandlerParams['appendHeader'] = (field, value) => {
    response.append(field, value);
  };

  const setStatusCode: HttpResponseInterceptorHandlerParams['setStatusCode'] = (statusCode) => {
    response.statusCode = statusCode;
  };

  const getCookie: HttpResponseInterceptorHandlerParams['getCookie'] = (name) =>
    request.cookies[name];
  const setCookie: HttpResponseInterceptorHandlerParams['setCookie'] = (name, value, options) => {
    if (options) {
      response.cookie(name, value, options);
      return;
    }
    response.cookie(name, value);
  };
  const clearCookie: HttpResponseInterceptorHandlerParams['clearCookie'] = (name, options) => {
    response.clearCookie(name, options);
  };

  const attachment: HttpResponseInterceptorHandlerParams['attachment'] = (filename) => {
    response.attachment(filename);
  };

  const log: HttpResponseInterceptorHandlerParams['log'] = (logger) =>
    callResponseLogger({ logger, data, request, response });

  const setDelay: HttpResponseInterceptorHandlerParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const responseInterceptorFnParams: HttpResponseInterceptorHandlerParams = {
    request,
    response,
    setDelay,
    setStatusCode,
    setHeader,
    appendHeader,
    getRequestHeader,
    getRequestHeaders,
    getResponseHeader,
    getResponseHeaders,
    setCookie,
    getCookie,
    clearCookie,
    attachment,
    log
  };

  let updatedData = data;

  const interceptorNames =
    meta.type === 'graphql'
      ? ['http.response.all', 'graphql.response.all', `graphql.response.${meta.operationType}`]
      : ['http.response.all', 'rest.response.all', `rest.response.${meta.method}`];

  const responseInterceptors = [...componentInterceptors, ...serverInterceptors].filter(
    (interceptor): interceptor is HttpResponseInterceptor =>
      interceptorNames.includes(interceptor[INTERCEPTOR_NAME])
  );

  for (const responseInterceptor of responseInterceptors) {
    updatedData = await responseInterceptor(updatedData, responseInterceptorFnParams);
  }
  return updatedData;
};
