import type { Request, Response } from 'express';

import type {
  Data,
  HttpResponseInterceptor,
  HttpResponseInterceptorFnParams,
  Interceptor,
  RestMethod,
  WsResponseInterceptor,
  WsResponseInterceptorFnParams
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

// TODO: separate to http and ws
export const callResponseInterceptors = async (params: CallResponseInterceptorsParams) => {
  const { data, request, response, componentInterceptors = [], serverInterceptors = [] } = params;

  if (request.api.type === 'rest' || request.api.type === 'graphql') {
    const getRequestHeader: HttpResponseInterceptorFnParams['getRequestHeader'] = (field: string) =>
      request.headers[field];
    const getRequestHeaders: HttpResponseInterceptorFnParams['getRequestHeaders'] = () =>
      request.headers;

    const getResponseHeader: HttpResponseInterceptorFnParams['getResponseHeader'] = (
      field: string
    ) => response.getHeader(field);
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
  }

  const setDelay: HttpResponseInterceptorFnParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const responseInterceptorFnParams: WsResponseInterceptorFnParams = {
    setDelay
  };

  let updatedData = data;

  const interceptorNames = ['ws.response.all', `ws.response.${request.api.ws.event}`];

  const responseInterceptors = [...componentInterceptors, ...serverInterceptors].filter(
    (interceptor): interceptor is WsResponseInterceptor =>
      interceptorNames.includes((interceptor as WsResponseInterceptor)[INTERCEPTOR_NAME])
  );

  for (const responseInterceptor of responseInterceptors) {
    updatedData = await responseInterceptor(updatedData, responseInterceptorFnParams);
  }
  return updatedData;
};
