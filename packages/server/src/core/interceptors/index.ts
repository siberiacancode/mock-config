import type { INTERCEPTOR_NAME } from '@/utils/constants';
import type {
  HttpRequestInterceptorHandler,
  HttpResponseInterceptorHandler,
  LeafKeys,
  WsRequestInterceptorHandler,
  WsResponseInterceptorHandler
} from '@/utils/types';

import { createInterceptor } from '@/utils/helpers';

export const http = {
  request: {
    all: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('http.request.all', interceptor)
  },
  response: {
    all: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('http.response.all', interceptor)
  }
};

export const rest = {
  request: {
    all: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('rest.request.all', interceptor),
    get: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('rest.request.get', interceptor),
    post: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('rest.request.post', interceptor),
    put: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('rest.request.put', interceptor),
    patch: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('rest.request.patch', interceptor),
    delete: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('rest.request.delete', interceptor),
    options: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('rest.request.options', interceptor)
  },
  response: {
    all: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('rest.response.all', interceptor),
    get: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('rest.response.get', interceptor),
    post: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('rest.response.post', interceptor),
    put: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('rest.response.put', interceptor),
    patch: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('rest.response.patch', interceptor),
    delete: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('rest.response.delete', interceptor),
    options: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('rest.response.options', interceptor)
  }
};

export const graphql = {
  request: {
    all: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('graphql.request.all', interceptor),
    query: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('graphql.request.query', interceptor),
    mutation: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('graphql.request.mutation', interceptor),
    subscription: (interceptor: HttpRequestInterceptorHandler) =>
      createInterceptor('graphql.request.subscription', interceptor)
  },
  response: {
    all: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('graphql.response.all', interceptor),
    query: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('graphql.response.query', interceptor),
    mutation: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('graphql.response.mutation', interceptor),
    subscription: (interceptor: HttpResponseInterceptorHandler) =>
      createInterceptor('graphql.response.subscription', interceptor)
  }
};

export const ws = {
  request: {
    all: (interceptor: WsRequestInterceptorHandler) =>
      createInterceptor('ws.request.all', interceptor),
    open: (interceptor: WsRequestInterceptorHandler) =>
      createInterceptor('ws.request.open', interceptor),
    close: (interceptor: WsRequestInterceptorHandler) =>
      createInterceptor('ws.request.close', interceptor),
    error: (interceptor: WsRequestInterceptorHandler) =>
      createInterceptor('ws.request.error', interceptor),
    message: (interceptor: WsRequestInterceptorHandler) =>
      createInterceptor('ws.request.message', interceptor)
  },
  response: {
    all: (interceptor: WsResponseInterceptorHandler) =>
      createInterceptor('ws.response.all', interceptor),
    open: (interceptor: WsResponseInterceptorHandler) =>
      createInterceptor('ws.response.open', interceptor),
    close: (interceptor: WsResponseInterceptorHandler) =>
      createInterceptor('ws.response.close', interceptor),
    error: (interceptor: WsResponseInterceptorHandler) =>
      createInterceptor('ws.response.error', interceptor),
    message: (interceptor: WsResponseInterceptorHandler) =>
      createInterceptor('ws.response.message', interceptor)
  }
};

export type InterceptorName = LeafKeys<{
  http: typeof http;
  rest: typeof rest;
  graphql: typeof graphql;
  ws: typeof ws;
}>;

export type RequestInterceptorName = Extract<InterceptorName, `${string}.request.${string}`>;
export type ResponseInterceptorName = Extract<InterceptorName, `${string}.response.${string}`>;

export type HttpRequestInterceptor = HttpRequestInterceptorHandler & {
  [INTERCEPTOR_NAME]: RequestInterceptorName;
};
export type WsRequestInterceptor = WsRequestInterceptorHandler & {
  [INTERCEPTOR_NAME]: RequestInterceptorName;
};

export type HttpResponseInterceptor = HttpResponseInterceptorHandler & {
  [INTERCEPTOR_NAME]: ResponseInterceptorName;
};
export type WsResponseInterceptor = WsResponseInterceptorHandler & {
  [INTERCEPTOR_NAME]: ResponseInterceptorName;
};

export type Interceptor =
  | HttpRequestInterceptor
  | HttpResponseInterceptor
  | WsRequestInterceptor
  | WsResponseInterceptor;
