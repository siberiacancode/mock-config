import type { Request, Response } from 'express';

import type {
  Data,
  Interceptor,
  ResponseInterceptor,
  ResponseInterceptorFnParams,
  RestMethod
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { callResponseLogger } from '../../logger';
import { sleep } from '../../sleep';

interface CallResponseInterceptorsParams {
  componentInterceptors?: Interceptor[];
  data: Data;
  request: Request;
  response: Response;
  serverInterceptors?: Interceptor[];
}

export const callResponseInterceptors = async (params: CallResponseInterceptorsParams) => {
  const { data, request, response, componentInterceptors = [], serverInterceptors = [] } = params;

  const getRequestHeader: ResponseInterceptorFnParams['getRequestHeader'] = (field: string) =>
    request.headers[field];
  const getRequestHeaders: ResponseInterceptorFnParams['getRequestHeaders'] = () => request.headers;

  const getResponseHeader: ResponseInterceptorFnParams['getResponseHeader'] = (field: string) =>
    response.getHeader(field);
  const getResponseHeaders: ResponseInterceptorFnParams['getResponseHeaders'] = () =>
    response.getHeaders();

  const setHeader = (field: string, value?: string | string[]) => {
    response.set(field, value);
  };
  const appendHeader: ResponseInterceptorFnParams['appendHeader'] = (field, value) => {
    response.append(field, value);
  };

  const setStatusCode: ResponseInterceptorFnParams['setStatusCode'] = (statusCode) => {
    response.statusCode = statusCode;
  };

  const getCookie: ResponseInterceptorFnParams['getCookie'] = (name) => request.cookies[name];
  const setCookie: ResponseInterceptorFnParams['setCookie'] = (name, value, options) => {
    if (options) {
      response.cookie(name, value, options);
      return;
    }
    response.cookie(name, value);
  };
  const clearCookie: ResponseInterceptorFnParams['clearCookie'] = (name, options) => {
    response.clearCookie(name, options);
  };

  const attachment: ResponseInterceptorFnParams['attachment'] = (filename) => {
    response.attachment(filename);
  };

  const log: ResponseInterceptorFnParams['log'] = (logger) =>
    callResponseLogger({ logger, data, request, response });

  const setDelay: ResponseInterceptorFnParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const responseInterceptorFnParams: ResponseInterceptorFnParams = {
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
    (interceptor): interceptor is ResponseInterceptor =>
      interceptorNames.includes((interceptor as ResponseInterceptor)[INTERCEPTOR_NAME])
  );

  for (const responseInterceptor of responseInterceptors) {
    updatedData = await responseInterceptor(updatedData, responseInterceptorFnParams);
  }
  return updatedData;
};
