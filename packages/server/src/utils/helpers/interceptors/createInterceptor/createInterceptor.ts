import type {
  HttpRequestInterceptor,
  HttpRequestInterceptorFn,
  HttpResponseInterceptor,
  HttpResponseInterceptorFn,
  Interceptor,
  InterceptorName,
  RequestInterceptorName,
  ResponseInterceptorName,
  WsRequestInterceptor,
  WsRequestInterceptorFn,
  WsResponseInterceptor,
  WsResponseInterceptorFn
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

export function createInterceptor(
  name: RequestInterceptorName,
  interceptor: WsRequestInterceptorFn
): WsRequestInterceptor;

export function createInterceptor(
  name: RequestInterceptorName,
  interceptor: HttpRequestInterceptorFn
): HttpRequestInterceptor;

export function createInterceptor(
  name: ResponseInterceptorName,
  interceptor: HttpResponseInterceptorFn
): HttpResponseInterceptor;

export function createInterceptor(
  name: ResponseInterceptorName,
  interceptor: WsResponseInterceptorFn
): WsResponseInterceptor;

export function createInterceptor(
  name: InterceptorName,
  interceptorFn:
    | HttpRequestInterceptorFn
    | HttpResponseInterceptorFn
    | WsRequestInterceptorFn
    | WsResponseInterceptorFn
) {
  (interceptorFn as Interceptor)[INTERCEPTOR_NAME] = name;
  return interceptorFn;
}
