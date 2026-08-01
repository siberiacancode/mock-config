import type { CookieOptions, Request, Response } from 'express';
import type { WebSocket } from 'ws';

import type { graphql, http, rest, ws } from '../../core/interceptors';
import type { INTERCEPTOR_NAME } from '../constants';
import type { GraphQLOperationType } from './graphql';
import type { Logger, LoggerTokens } from './logger';
import type { RestMethod } from './rest';
import type { ApiType } from './shared';
import type { LeafKeys, MaybePromise } from './utils';
import type { WsEvent, WsMessageType } from './ws';

type InterceptorCookieValue = string | undefined;
type InterceptorHeaderValue = number | string | string[] | undefined;

export interface HttpRequestInterceptorHandlerParams {
  request: Request;
  getCookie: (name: string) => InterceptorCookieValue;
  getHeader: (field: string) => InterceptorHeaderValue;
  getHeaders: () => Record<string, InterceptorHeaderValue>;
  log: (logger?: Logger<'request'>) => Partial<LoggerTokens>;
  setDelay: (delay: number) => Promise<void>;
}

export type HttpRequestInterceptorHandler = (
  params: HttpRequestInterceptorHandlerParams
) => MaybePromise<void>;

export interface HttpResponseInterceptorHandlerParams {
  request: Request;
  response: Response;
  appendHeader: (field: string, value?: string | string[]) => void;
  attachment: (filename: string) => void;
  clearCookie: (name: string, options?: CookieOptions) => void;
  getCookie: (name: string) => InterceptorCookieValue;
  getRequestHeader: (field: string) => InterceptorHeaderValue;
  getRequestHeaders: () => Record<string, InterceptorHeaderValue>;
  getResponseHeader: (field: string) => InterceptorHeaderValue;
  getResponseHeaders: () => Record<string, InterceptorHeaderValue>;
  log: (logger?: Logger<'response'>) => Partial<LoggerTokens>;
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  setDelay: (delay: number) => Promise<void>;
  setHeader: (field: string, value?: string | string[]) => void;
  setStatusCode: (statusCode: number) => void;
}

export type HttpResponseInterceptorHandler<Data = any> = (
  data: Data,
  params: HttpResponseInterceptorHandlerParams
) => any;

export interface WsRequestInterceptorHandlerParams {
  socket: WebSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type WsRequestInterceptorHandler = (
  params: WsRequestInterceptorHandlerParams
) => MaybePromise<void>;

export interface WsResponseInterceptorHandlerParams {
  socket: WebSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type WsResponseInterceptorHandler<Data = any> = (
  data: Data,
  params: WsResponseInterceptorHandlerParams
) => any;

interface RestInterceptorMeta {
  method: RestMethod;
  type: Extract<ApiType, 'rest'>;
}

interface GraphqlInterceptorMeta {
  operationType: GraphQLOperationType;
  type: Extract<ApiType, 'graphql'>;
}

export type HttpInterceptorMeta = GraphqlInterceptorMeta | RestInterceptorMeta;

export type WsInterceptorMeta =
  | {
      type: Extract<ApiType, 'ws'>;
      event: Exclude<WsEvent, 'message'>;
    }
  | {
      type: Extract<ApiType, 'ws'>;
      event: Extract<WsEvent, 'message'>;
      messageType: WsMessageType;
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
