import type { CookieOptions } from 'express';

import type { BaseUrl, Data, RestMethod, RestPathString } from '@/utils/types';

import type { NativeInterceptors } from './interceptors';

export interface NativeRestParams<
  Query = Record<string, string | string[]>,
  Body = any,
  Params = Record<string, string>
> {
  request: MockServerRequest<Query, Body, Params>;
  appendHeader: (name: string, value: string) => void;
  clearCookie: (name: string) => void;
  getCookie: (name: string) => string | undefined;
  getRequestHeader: (name: string) => string | undefined;
  getRequestHeaders: () => Record<string, string>;
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  setDelay: (delay: number) => Promise<void>;
  setHeader: (name: string, value: string) => void;
  setStatusCode: (statusCode: number) => void;
}

export type NativeRestDataResponseFunction = (
  params: NativeRestParams
) => Promise<Response> | Response;

export type NativeRestDataResponse = Data | NativeRestDataResponseFunction;

export interface NativeRestRouteConfig {
  data: NativeRestDataResponse;
  entities?: Record<string, unknown>;
  interceptors?: NativeInterceptors;
  settings?: {
    readonly delay?: number;
    readonly status?: number;
  };
}

export interface NativeRestRequestArtifact {
  baseUrl: BaseUrl;
  componentRequestInterceptor?: NativeInterceptors['request'];
  componentResponseInterceptor?: NativeInterceptors['response'];
  config: NativeRestRouteConfig;
  method: RestMethod;
  path: RegExp | RestPathString;
  requestRequestInterceptor?: NativeInterceptors['request'];
  requestResponseInterceptor?: NativeInterceptors['response'];
  routeRequestInterceptor?: NativeInterceptors['request'];
  routeResponseInterceptor?: NativeInterceptors['response'];
  serverRequestInterceptor?: NativeInterceptors['request'];
  serverResponseInterceptor?: NativeInterceptors['response'];
  weight: number;
}
