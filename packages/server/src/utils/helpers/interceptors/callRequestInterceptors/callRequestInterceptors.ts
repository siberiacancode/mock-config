import type { Request } from 'express';

import type {
  HttpRequestInterceptor,
  HttpRequestInterceptorFnParams,
  Interceptor,
  RestMethod,
  WsRequestInterceptor,
  WsRequestInterceptorFnParams
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { callRequestLogger } from '../../logger';
import { sleep } from '../../sleep';

interface CallRequestInterceptorsParams {
  interceptors: Interceptor[];
  request: Request;
  // socket: WebSocket;
  // broadcast: (data: unknown) => void;
  // send: (data: unknown) => void;
}

export const callRequestInterceptors = async ({
  interceptors,
  request
  // socket
  // broadcast,
  // send
}: CallRequestInterceptorsParams) => {
  if (request.api.type === 'rest' || request.api.type === 'graphql') {
    const getHeader: HttpRequestInterceptorFnParams['getHeader'] = (field) =>
      request.headers[field];
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
      request.api.type === 'graphql'
        ? [
            'http.request.all',
            'graphql.request.all',
            `graphql.request.${request.api.graphQL.operationType}`
          ]
        : [
            'http.request.all',
            'rest.request.all',
            `rest.request.${request.method.toLowerCase() as RestMethod}`
          ];

    const requestInterceptors = interceptors.filter(
      (interceptor): interceptor is HttpRequestInterceptor =>
        interceptorNames.includes((interceptor as HttpRequestInterceptor)[INTERCEPTOR_NAME])
    );

    for (const requestInterceptor of requestInterceptors) {
      await requestInterceptor(requestInterceptorFnParams);
    }
    return;
  }
  console.log('WS REQUEST INTERCEPTOR request.api=', request.api);
  const setDelay: WsRequestInterceptorFnParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };
  // const frame: WsFrame = isBinary
  //   ? { isBinary: true, raw: raw as Buffer }
  //   : { isBinary: false, raw: raw.toString() };
  const requestInterceptorFnParams: WsRequestInterceptorFnParams = {
    // ...frame,
    // broadcast,
    // socket,
    // send,
    setDelay
  };

  const interceptorNames = ['ws.request.all', `ws.request.${request.api.ws.event}`];

  const requestInterceptors = interceptors.filter(
    (interceptor): interceptor is WsRequestInterceptor =>
      interceptorNames.includes((interceptor as WsRequestInterceptor)[INTERCEPTOR_NAME])
  );

  for (const requestInterceptor of requestInterceptors) {
    await requestInterceptor(requestInterceptorFnParams);
  }
};
