import type { CookieOptions, Request, Response } from 'express';

import type { Database, Orm } from './database';
import type { Logger, LoggerTokens } from './logger';
import type { MaybePromise } from './utils';

type InterceptorCookieValue = string | undefined;
type InterceptorHeaderValue = number | string | string[] | undefined;

export interface RequestInterceptorFnParams {
  orm: Orm<Database>;
  request: Request;
  getCookie: (name: string) => InterceptorCookieValue;
  getHeader: (field: string) => InterceptorHeaderValue;
  getHeaders: () => Record<string, InterceptorHeaderValue>;
  log: (logger?: Logger<'request'>) => Partial<LoggerTokens>;
  setDelay: (delay: number) => Promise<void>;
}

export type RequestInterceptorFn = (params: RequestInterceptorFnParams) => MaybePromise<void>;

export interface ResponseInterceptorFnParams {
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

export type ResponseInterceptorFn<Data = any> = (
  data: Data,
  params: ResponseInterceptorFnParams
) => any;

export type {
  InterceptorName,
  Interceptors,
  RequestInterceptor,
  RequestInterceptorName,
  ResponseInterceptor,
  ResponseInterceptorName
} from '../../core/interceptors';
