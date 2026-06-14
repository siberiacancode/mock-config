import type {
  RequestInterceptor,
  RequestInterceptorFn,
  RequestInterceptorName,
  ResponseInterceptor,
  ResponseInterceptorFn,
  ResponseInterceptorName
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

export function createInterceptor(
  name: RequestInterceptorName,
  interceptor: RequestInterceptorFn
): RequestInterceptor;

export function createInterceptor(
  name: ResponseInterceptorName,
  interceptor: ResponseInterceptorFn
): ResponseInterceptor;

export function createInterceptor(
  name: RequestInterceptorName | ResponseInterceptorName,
  interceptorFn: RequestInterceptorFn | ResponseInterceptorFn
) {
  (interceptorFn as RequestInterceptor | ResponseInterceptor)[INTERCEPTOR_NAME] = name;
  return interceptorFn;
}
