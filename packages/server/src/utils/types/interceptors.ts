import type { CookieOptions, Request, Response } from 'express';

import type { Database, Orm } from './database';
import type { Logger, LoggerTokens } from './logger';
import type { MaybePromise } from './utils';

type InterceptorCookieValue = string | undefined;
type InterceptorHeaderValue = number | string | string[] | undefined;

export interface HttpRequestInterceptorFnParams {
  orm: Orm<Database>;
  request: Request;
  getCookie: (name: string) => InterceptorCookieValue;
  getHeader: (field: string) => InterceptorHeaderValue;
  getHeaders: () => Record<string, InterceptorHeaderValue>;
  log: (logger?: Logger<'request'>) => Partial<LoggerTokens>;
  setDelay: (delay: number) => Promise<void>;
}

export type HttpRequestInterceptorFn = (
  params: HttpRequestInterceptorFnParams
) => MaybePromise<void>;

export interface HttpResponseInterceptorFnParams {
  orm: Orm<Database>;
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

export type HttpResponseInterceptorFn<Data = any> = (
  data: Data,
  params: HttpResponseInterceptorFnParams
) => any;

export interface WsRequestInterceptorFnParams {
  // socket: WebSocket;
  // broadcast: <Response = unknown>(response: Response) => void;
  // send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type WsRequestInterceptorFn = (params: WsRequestInterceptorFnParams) => MaybePromise<void>;

export interface WsResponseInterceptorFnParams {
  // socket: WebSocket;
  // broadcast: <Response = unknown>(response: Response) => void;
  // send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type WsResponseInterceptorFn<Data = any> = (
  data: Data,
  params: WsResponseInterceptorFnParams
) => any;

export type {
  HttpRequestInterceptor,
  HttpResponseInterceptor,
  Interceptor,
  InterceptorName,
  RequestInterceptorName,
  ResponseInterceptorName,
  WsRequestInterceptor,
  WsResponseInterceptor
} from '../../core/interceptors';
