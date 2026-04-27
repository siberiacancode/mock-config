import { serialize } from 'cookie';

import { sleep } from '@/utils/helpers';

import type { NativeResponseInterceptor, NativeResponseInterceptorParams } from '../../types';

export interface ResponseInterceptorsState {
  headers: Headers;
  statusCode?: number;
}

interface CallNativeResponseInterceptorsParams {
  interceptors?: {
    routeInterceptor?: NativeResponseInterceptor;
    requestInterceptor?: NativeResponseInterceptor;
    componentInterceptor?: NativeResponseInterceptor;
    serverInterceptor?: NativeResponseInterceptor;
  };
  request: MockServerRequest;
  response: Response;
  responseState: ResponseInterceptorsState;
}

export const callResponseInterceptors = async (params: CallNativeResponseInterceptorsParams) => {
  const { request, response, interceptors, responseState } = params;

  const responseInterceptorParams: NativeResponseInterceptorParams = {
    request,
    appendHeader: (name, value) => {
      responseState.headers.append(name, value);
    },
    clearCookie: (name) => {
      responseState.headers.append(
        'set-cookie',
        serialize(name, '', {
          expires: new Date(0),
          maxAge: 0,
          path: '/'
        })
      );
    },
    getCookie: (name) => request.cookies[name],
    getRequestHeader: (name) => request.headers[name],
    getRequestHeaders: () => request.headers,
    getResponseHeader: (name) => response.headers.get(name) ?? undefined,
    getResponseHeaders: () => Object.fromEntries(response.headers.entries()),
    setCookie: (name, value, options) => {
      responseState.headers.append('set-cookie', serialize(name, value, options));
    },
    setDelay: async (delay) => {
      await sleep(delay === Infinity ? 99999999 : delay);
    },
    setHeader: (name, value) => {
      responseState.headers.set(name, value);
    },
    setStatusCode: (statusCode) => {
      responseState.statusCode = statusCode;
    }
  };

  const responseInterceptors = [
    interceptors?.routeInterceptor,
    interceptors?.requestInterceptor,
    interceptors?.componentInterceptor,
    interceptors?.serverInterceptor
  ].filter((responseInterceptor) => !!responseInterceptor);

  let updatedResponse = response;
  for (const responseInterceptor of responseInterceptors) {
    updatedResponse = await responseInterceptor(updatedResponse, responseInterceptorParams);
  }

  return updatedResponse;
};
