import type { Request } from 'express';

import type { RequestInterceptor, RequestInterceptorParams } from '@/utils/types';

import { callRequestLogger } from '../../logger';
import { setDelay } from '../helpers/setDelay';

interface CallRequestInterceptorParams {
  interceptor: RequestInterceptor;
  request: Request;
}

export const callRequestInterceptor = async (params: CallRequestInterceptorParams) => {
  const { request, interceptor } = params;

  const getHeader: RequestInterceptorParams['getHeader'] = (field) => request.headers[field];
  const getHeaders: RequestInterceptorParams['getHeaders'] = () => request.headers;

  const getCookie: RequestInterceptorParams['getCookie'] = (name) => request.cookies[name];

  const log: RequestInterceptorParams['log'] = (logger) => callRequestLogger({ logger, request });

  const requestInterceptorParams: RequestInterceptorParams = {
    request,
    setDelay,
    getHeader,
    getHeaders,
    getCookie,
    log,
    orm: request.context.orm
  };

  await interceptor(requestInterceptorParams);
};
