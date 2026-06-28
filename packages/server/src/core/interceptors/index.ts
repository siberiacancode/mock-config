import type { INTERCEPTOR_NAME } from '@/utils/constants';
import type {
  HttpRequestInterceptorFn,
  HttpResponseInterceptorFn,
  LeafKeys,
  WsRequestInterceptorFn,
  WsResponseInterceptorFn
} from '@/utils/types';

import { createInterceptor } from '@/utils/helpers';

export const http = {
  request: {
    all: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('http.request.all', interceptor)
  },
  response: {
    all: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('http.response.all', interceptor)
  }
};

export const rest = {
  request: {
    all: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('rest.request.all', interceptor),
    get: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('rest.request.get', interceptor),
    post: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('rest.request.post', interceptor),
    put: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('rest.request.put', interceptor),
    patch: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('rest.request.patch', interceptor),
    delete: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('rest.request.delete', interceptor),
    options: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('rest.request.options', interceptor)
  },
  response: {
    all: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('rest.response.all', interceptor),
    get: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('rest.response.get', interceptor),
    post: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('rest.response.post', interceptor),
    put: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('rest.response.put', interceptor),
    patch: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('rest.response.patch', interceptor),
    delete: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('rest.response.delete', interceptor),
    options: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('rest.response.options', interceptor)
  }
};

export const graphql = {
  request: {
    all: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('graphql.request.all', interceptor),
    query: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('graphql.request.query', interceptor),
    mutation: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('graphql.request.mutation', interceptor),
    subscription: (interceptor: HttpRequestInterceptorFn) =>
      createInterceptor('graphql.request.subscription', interceptor)
  },
  response: {
    all: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('graphql.response.all', interceptor),
    query: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('graphql.response.query', interceptor),
    mutation: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('graphql.response.mutation', interceptor),
    subscription: (interceptor: HttpResponseInterceptorFn) =>
      createInterceptor('graphql.response.subscription', interceptor)
  }
};

export const ws = {
  request: {
    all: (interceptor: WsRequestInterceptorFn) => createInterceptor('ws.request.all', interceptor),
    open: (interceptor: WsRequestInterceptorFn) =>
      createInterceptor('ws.request.open', interceptor),
    close: (interceptor: WsRequestInterceptorFn) =>
      createInterceptor('ws.request.close', interceptor),
    error: (interceptor: WsRequestInterceptorFn) =>
      createInterceptor('ws.request.error', interceptor),
    message: (interceptor: WsRequestInterceptorFn) =>
      createInterceptor('ws.request.message', interceptor)
  },
  response: {
    all: (interceptor: WsResponseInterceptorFn) =>
      createInterceptor('ws.response.all', interceptor),
    open: (interceptor: WsResponseInterceptorFn) =>
      createInterceptor('ws.response.open', interceptor),
    close: (interceptor: WsResponseInterceptorFn) =>
      createInterceptor('ws.response.close', interceptor),
    error: (interceptor: WsResponseInterceptorFn) =>
      createInterceptor('ws.response.error', interceptor),
    message: (interceptor: WsResponseInterceptorFn) =>
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

export type HttpRequestInterceptor = HttpRequestInterceptorFn & {
  [INTERCEPTOR_NAME]: RequestInterceptorName;
};
export type WsRequestInterceptor = WsRequestInterceptorFn & {
  [INTERCEPTOR_NAME]: RequestInterceptorName;
};

export type HttpResponseInterceptor = HttpResponseInterceptorFn & {
  [INTERCEPTOR_NAME]: ResponseInterceptorName;
};
export type WsResponseInterceptor = WsResponseInterceptorFn & {
  [INTERCEPTOR_NAME]: ResponseInterceptorName;
};

export type Interceptor =
  | HttpRequestInterceptor
  | HttpResponseInterceptor
  | WsRequestInterceptor
  | WsResponseInterceptor;
