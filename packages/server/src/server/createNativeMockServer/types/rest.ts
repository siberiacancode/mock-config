import type { CookieOptions } from 'express';

import type { BaseUrl, Data, RestMethod, RestPathString } from '@/utils/types';

import type { NativeInterceptors } from './interceptors';

export interface NativeRestParams<Method extends RestMethod = RestMethod> {
  method?: Method;
  request: MockServerRequest;
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

export type NativeRestDataResponseFunction<Method extends RestMethod = RestMethod> = (
  params: NativeRestParams<Method>
) => Promise<Response> | Response;

export type NativeRestDataResponse<Method extends RestMethod = RestMethod> =
  | Data
  | NativeRestDataResponseFunction<Method>;

export interface NativeRestRouteConfig<Method extends RestMethod = RestMethod> {
  data: NativeRestDataResponse<Method>;
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
  config: NativeRestRouteConfig<RestMethod>;
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
