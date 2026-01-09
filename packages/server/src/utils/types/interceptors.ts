import type { CookieOptions, Request, Response } from 'express';

import type { Database, Orm } from './database';
import type { Logger, LoggerTokens } from './logger';
import type { ApiType } from './shared';

type InterceptorCookieValue = string | undefined;
type InterceptorHeaderValue = number | string | string[] | undefined;

export interface RequestInterceptorParams<Api extends ApiType = ApiType> {
  orm: Orm<Database>;
  request: Request;
  getCookie: (name: string) => InterceptorCookieValue;
  getHeader: (field: string) => InterceptorHeaderValue;
  getHeaders: () => Record<string, InterceptorHeaderValue>;
  log: (logger?: Logger<'request', Api>) => Partial<LoggerTokens>;
  setDelay: (delay: number) => Promise<void>;
}

export type RequestInterceptor<Api extends ApiType = ApiType> = (
  params: RequestInterceptorParams<Api>
) => Promise<void> | void;

export interface ResponseInterceptorParams<Api extends ApiType = ApiType> {
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
  log: (logger?: Logger<'response', Api>) => Partial<LoggerTokens>;
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  setDelay: (delay: number) => Promise<void>;
  setHeader: (field: string, value?: string | string[]) => void;
  setStatusCode: (statusCode: number) => void;
}

export type ResponseInterceptor<Data = any, Api extends ApiType = ApiType> = (
  data: Data,
  params: ResponseInterceptorParams<Api>
) => any;

export interface Interceptors<Api extends ApiType = ApiType> {
  request?: RequestInterceptor<Api>;
  response?: ResponseInterceptor<any, Api>;
}
