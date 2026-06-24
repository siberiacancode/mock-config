import type { Request, Response } from 'express';

import type {
  Data,
  HttpResponseInterceptor,
  HttpResponseInterceptorFnParams,
  Interceptor,
  RestMethod
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { callResponseLogger } from '../../../logger';
import { sleep } from '../../../sleep';

interface CallHttpResponseInterceptorsParams {
  componentInterceptors?: Interceptor[];
  data: Data;
  request: Request;
  response: Response;
  serverInterceptors?: Interceptor[];
}

export const callHttpResponseInterceptors = async (params: CallHttpResponseInterceptorsParams) => {
  const { data, request, response, componentInterceptors = [], serverInterceptors = [] } = params;

  const getRequestHeader: HttpResponseInterceptorFnParams['getRequestHeader'] = (field: string) =>
    request.headers[field];
  const getRequestHeaders: HttpResponseInterceptorFnParams['getRequestHeaders'] = () =>
    request.headers;

  const getResponseHeader: HttpResponseInterceptorFnParams['getResponseHeader'] = (field: string) =>
    response.getHeader(field);
  const getResponseHeaders: HttpResponseInterceptorFnParams['getResponseHeaders'] = () =>
    response.getHeaders();

  const setHeader = (field: string, value?: string | string[]) => {
    response.set(field, value);
  };
  const appendHeader: HttpResponseInterceptorFnParams['appendHeader'] = (field, value) => {
    response.append(field, value);
  };

  const setStatusCode: HttpResponseInterceptorFnParams['setStatusCode'] = (statusCode) => {
    response.statusCode = statusCode;
  };

  const getCookie: HttpResponseInterceptorFnParams['getCookie'] = (name) => request.cookies[name];
  const setCookie: HttpResponseInterceptorFnParams['setCookie'] = (name, value, options) => {
    if (options) {
      response.cookie(name, value, options);
      return;
    }
    response.cookie(name, value);
  };
  const clearCookie: HttpResponseInterceptorFnParams['clearCookie'] = (name, options) => {
    response.clearCookie(name, options);
  };

  const attachment: HttpResponseInterceptorFnParams['attachment'] = (filename) => {
    response.attachment(filename);
  };

  const log: HttpResponseInterceptorFnParams['log'] = (logger) =>
    callResponseLogger({ logger, data, request, response });

  const setDelay: HttpResponseInterceptorFnParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const responseInterceptorFnParams: HttpResponseInterceptorFnParams = {
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
    log,
    orm: request.context.orm
  };

  let updatedData = data;

  const interceptorNames =
    request.api.type === 'graphql'
      ? [
          'http.response.all',
          'graphql.response.all',
          `graphql.response.${request.api.graphQL.operationType}`
        ]
      : [
          'http.response.all',
          'rest.response.all',
          `rest.response.${request.method.toLowerCase() as RestMethod}`
        ];

  const responseInterceptors = [...componentInterceptors, ...serverInterceptors].filter(
    (interceptor): interceptor is HttpResponseInterceptor =>
      interceptorNames.includes((interceptor as HttpResponseInterceptor)[INTERCEPTOR_NAME])
  );

  for (const responseInterceptor of responseInterceptors) {
    updatedData = await responseInterceptor(updatedData, responseInterceptorFnParams);
  }
  return updatedData;
};
