import type {
  GraphQLOperationType,
  GraphQLTransportWsOperationType,
  HttpRequestInterceptor,
  HttpRequestInterceptorHandler,
  HttpResponseInterceptor,
  HttpResponseInterceptorHandler,
  InterceptorName,
  RestMethod,
  WsEvent,
  WsRequestInterceptor,
  WsRequestInterceptorHandler,
  WsResponseInterceptor,
  WsResponseInterceptorHandler
} from '@/utils/types';

import { createInterceptor } from '@/utils/helpers';

const createInterceptorFactories =
  <Handler, Result>() =>
  <const Names extends readonly string[]>(prefix: string, names: Names) =>
    Object.fromEntries(
      names.map((name) => [
        name,
        (interceptor: Handler): Result =>
          (createInterceptor as any)(`${prefix}.${name}` as InterceptorName, interceptor)
      ])
    ) as { [Name in Names[number]]: (interceptor: Handler) => Result };

const httpRequest = createInterceptorFactories<
  HttpRequestInterceptorHandler,
  HttpRequestInterceptor
>();
const httpResponse = createInterceptorFactories<
  HttpResponseInterceptorHandler,
  HttpResponseInterceptor
>();
const wsRequest = createInterceptorFactories<WsRequestInterceptorHandler, WsRequestInterceptor>();
const wsResponse = createInterceptorFactories<
  WsResponseInterceptorHandler,
  WsResponseInterceptor
>();

type HttpInterceptorName = 'all';
const HTTP_NAMES = ['all'] satisfies HttpInterceptorName[];
export const http = {
  request: httpRequest('http.request', HTTP_NAMES),
  response: httpResponse('http.response', HTTP_NAMES)
};

type RestInterceptorName = 'all' | RestMethod;
const REST_NAMES = [
  'all',
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options'
] satisfies RestInterceptorName[];
export const rest = {
  request: httpRequest('rest.request', REST_NAMES),
  response: httpResponse('rest.response', REST_NAMES)
};

type GraphqlInterceptorName = 'all' | GraphQLOperationType | GraphQLTransportWsOperationType;
const GRAPHQL_NAMES = [
  'all',
  'query',
  'mutation',
  'subscription'
] satisfies GraphqlInterceptorName[];
export const graphql = {
  request: httpRequest('graphql.request', GRAPHQL_NAMES),
  response: httpResponse('graphql.response', GRAPHQL_NAMES)
};

type WsInterceptorName = 'all' | WsEvent;
const WS_NAMES = ['all', 'open', 'close', 'error', 'message'] satisfies WsInterceptorName[];
export const ws = {
  request: wsRequest('ws.request', WS_NAMES),
  response: wsResponse('ws.response', WS_NAMES)
};
