import type { CookieOptions } from 'express';

export interface NativeRequestInterceptorParams {
  request: MockServerRequest;
  getCookie: (name: string) => string | undefined;
  getHeader: (name: string) => string | undefined;
  getHeaders: () => Record<string, string>;
  setDelay: (delay: number) => Promise<void>;
}

export type NativeRequestInterceptor = (
  params: NativeRequestInterceptorParams
) => Promise<void> | void;

export interface NativeResponseInterceptorParams {
  request: MockServerRequest;
  response: Response;
  appendHeader: (name: string, value: string) => void;
  clearCookie: (name: string) => void;
  getCookie: (name: string) => string | undefined;
  getRequestHeader: (name: string) => string | undefined;
  getRequestHeaders: () => Record<string, string>;
  getResponseHeader: (name: string) => string | undefined;
  getResponseHeaders: () => Record<string, string>;
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  setDelay: (delay: number) => Promise<void>;
  setHeader: (name: string, value: string) => void;
  setStatusCode: (statusCode: number) => void;
}

export type NativeResponseInterceptor = (
  data: Response,
  params: NativeResponseInterceptorParams
) => Promise<Response> | Response;

export interface NativeInterceptors {
  request?: NativeRequestInterceptor;
  response?: NativeResponseInterceptor;
}
