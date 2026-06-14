import type { INTERCEPTOR_NAME } from '@/utils/constants';
import type { LeafKeys, RequestInterceptorFn, ResponseInterceptorFn } from '@/utils/types';

import { createInterceptor } from '@/utils/helpers';

export const http = {
  request: {
    all: (interceptor: RequestInterceptorFn) => createInterceptor('http.request.all', interceptor)
  },
  response: {
    all: (interceptor: ResponseInterceptorFn) => createInterceptor('http.response.all', interceptor)
  }
};

export const rest = {
  request: {
    all: (interceptor: RequestInterceptorFn) => createInterceptor('rest.request.all', interceptor),
    get: (interceptor: RequestInterceptorFn) => createInterceptor('rest.request.get', interceptor),
    post: (interceptor: RequestInterceptorFn) =>
      createInterceptor('rest.request.post', interceptor),
    put: (interceptor: RequestInterceptorFn) => createInterceptor('rest.request.put', interceptor),
    patch: (interceptor: RequestInterceptorFn) =>
      createInterceptor('rest.request.patch', interceptor),
    delete: (interceptor: RequestInterceptorFn) =>
      createInterceptor('rest.request.delete', interceptor),
    options: (interceptor: RequestInterceptorFn) =>
      createInterceptor('rest.request.options', interceptor)
  },
  response: {
    all: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('rest.response.all', interceptor),
    get: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('rest.response.get', interceptor),
    post: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('rest.response.post', interceptor),
    put: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('rest.response.put', interceptor),
    patch: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('rest.response.patch', interceptor),
    delete: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('rest.response.delete', interceptor),
    options: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('rest.response.options', interceptor)
  }
};

export const graphql = {
  request: {
    all: (interceptor: RequestInterceptorFn) =>
      createInterceptor('graphql.request.all', interceptor),
    query: (interceptor: RequestInterceptorFn) =>
      createInterceptor('graphql.request.query', interceptor),
    mutation: (interceptor: RequestInterceptorFn) =>
      createInterceptor('graphql.request.mutation', interceptor),
    subscription: (interceptor: RequestInterceptorFn) =>
      createInterceptor('graphql.request.subscription', interceptor)
  },
  response: {
    all: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('graphql.response.all', interceptor),
    query: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('graphql.response.query', interceptor),
    mutation: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('graphql.response.mutation', interceptor),
    subscription: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('graphql.response.subscription', interceptor)
  }
};

// TODO: make RequestWsInterceptor and disconnect
export const ws = {
  request: {
    all: (interceptor: RequestInterceptorFn) => createInterceptor('ws.request.all', interceptor),
    connection: (interceptor: RequestInterceptorFn) =>
      createInterceptor('ws.request.connection', interceptor),
    graphql: (interceptor: RequestInterceptorFn) =>
      createInterceptor('ws.request.graphql', interceptor),
    message: (interceptor: RequestInterceptorFn) =>
      createInterceptor('ws.request.message', interceptor)
  },
  response: {
    all: (interceptor: ResponseInterceptorFn) => createInterceptor('ws.response.all', interceptor),
    connection: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('ws.response.connection', interceptor),
    graphql: (interceptor: ResponseInterceptorFn) =>
      createInterceptor('ws.response.graphql', interceptor),
    message: (interceptor: ResponseInterceptorFn) =>
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

export type RequestInterceptor = RequestInterceptorFn & {
  [INTERCEPTOR_NAME]: RequestInterceptorName;
};

export type ResponseInterceptor = ResponseInterceptorFn & {
  [INTERCEPTOR_NAME]: ResponseInterceptorName;
};

export type Interceptors = (RequestInterceptor | ResponseInterceptor)[];
