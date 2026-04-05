import type { CookieOptions, Request, Response } from 'express';

import type { Logger, LoggerTokens } from './logger';

type InterceptorCookieValue = string | undefined;
type InterceptorHeaderValue = number | string | string[] | undefined;

export interface RequestInterceptorParams {
  request: Request;
  getCookie: (name: string) => InterceptorCookieValue;
  getHeader: (field: string) => InterceptorHeaderValue;
  getHeaders: () => Record<string, InterceptorHeaderValue>;
  log: (logger?: Logger<'request'>) => Partial<LoggerTokens>;
  setDelay: (delay: number) => Promise<void>;
}

export type RequestInterceptor = (params: RequestInterceptorParams) => Promise<void> | void;

export interface ResponseInterceptorParams {
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

export type ResponseInterceptor<Data = any> = (
  data: Data,
  params: ResponseInterceptorParams
) => any;

export interface Interceptors {
  request?: RequestInterceptor;
  response?: ResponseInterceptor<any>;
}
