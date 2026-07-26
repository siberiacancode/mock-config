import type {
  HttpRequestInterceptor,
  HttpRequestInterceptorHandler,
  HttpResponseInterceptor,
  HttpResponseInterceptorHandler,
  Interceptor,
  InterceptorName,
  RequestInterceptorName,
  ResponseInterceptorName,
  WsRequestInterceptor,
  WsRequestInterceptorHandler,
  WsResponseInterceptor,
  WsResponseInterceptorHandler
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

export function createInterceptor(
  name: RequestInterceptorName,
  interceptor: WsRequestInterceptorHandler
): WsRequestInterceptor;
export function createInterceptor(
  name: RequestInterceptorName,
  interceptor: HttpRequestInterceptorHandler
): HttpRequestInterceptor;
export function createInterceptor(
  name: ResponseInterceptorName,
  interceptor: HttpResponseInterceptorHandler
): HttpResponseInterceptor;
export function createInterceptor(
  name: ResponseInterceptorName,
  interceptor: WsResponseInterceptorHandler
): WsResponseInterceptor;
export function createInterceptor(
  name: InterceptorName,
  interceptorHandler:
    | HttpRequestInterceptorHandler
    | HttpResponseInterceptorHandler
    | WsRequestInterceptorHandler
    | WsResponseInterceptorHandler
) {
  (interceptorHandler as Interceptor)[INTERCEPTOR_NAME] = name;
  return interceptorHandler;
}
