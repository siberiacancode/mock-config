import type { Request, Response } from 'express';

import type { Data, ResponseInterceptor, ResponseInterceptorParams } from '@/utils/types';

import { callResponseLogger } from '../../logger';
import { setDelay } from '../helpers/setDelay';

interface CallResponseInterceptorsParams {
  data: Data;
  request: Request;
  response: Response;
  interceptors?: {
    routeInterceptor?: ResponseInterceptor;
    requestInterceptor?: ResponseInterceptor;
    apiInterceptor?: ResponseInterceptor;
    serverInterceptor?: ResponseInterceptor;
  };
}

export const callResponseInterceptors = async (params: CallResponseInterceptorsParams) => {
  const { data, request, response, interceptors } = params;

  const getRequestHeader: ResponseInterceptorParams['getRequestHeader'] = (field: string) =>
    request.headers[field];
  const getRequestHeaders: ResponseInterceptorParams['getRequestHeaders'] = () => request.headers;

  const getResponseHeader: ResponseInterceptorParams['getResponseHeader'] = (field: string) =>
    response.getHeader(field);
  const getResponseHeaders: ResponseInterceptorParams['getResponseHeaders'] = () =>
    response.getHeaders();

  const setHeader = (field: string, value?: string | string[]) => {
    response.set(field, value);
  };
  const appendHeader: ResponseInterceptorParams['appendHeader'] = (field, value) => {
    response.append(field, value);
  };

  const setStatusCode: ResponseInterceptorParams['setStatusCode'] = (statusCode) => {
    response.statusCode = statusCode;
  };

  const getCookie: ResponseInterceptorParams['getCookie'] = (name) => request.cookies[name];
  const setCookie: ResponseInterceptorParams['setCookie'] = (name, value, options) => {
    if (options) {
      response.cookie(name, value, options);
      return;
    }
    response.cookie(name, value);
  };
  const clearCookie: ResponseInterceptorParams['clearCookie'] = (name, options) => {
    response.clearCookie(name, options);
  };

  const attachment: ResponseInterceptorParams['attachment'] = (filename) => {
    response.attachment(filename);
  };

  const log: ResponseInterceptorParams['log'] = (logger) =>
    callResponseLogger({ logger, data, request, response });

  const responseInterceptorParams: ResponseInterceptorParams = {
    request,
    response,
    setDelay,
    setStatusCode,
    setHeader,
    appendHeader,
    getRequestHeader,
    getRequestHeaders,
    getResponseHeader,
    getResponseHeaders,
    setCookie,
    getCookie,
    clearCookie,
    attachment,
    log,
    orm: request.context.orm
  };

  let updatedData = data;
  if (interceptors?.routeInterceptor) {
    updatedData = await interceptors.routeInterceptor(updatedData, responseInterceptorParams);
  }
  if (interceptors?.requestInterceptor) {
    updatedData = await interceptors.requestInterceptor(updatedData, responseInterceptorParams);
  }
  if (interceptors?.apiInterceptor) {
    updatedData = await interceptors.apiInterceptor(updatedData, responseInterceptorParams);
  }
  if (interceptors?.serverInterceptor) {
    updatedData = await interceptors.serverInterceptor(updatedData, responseInterceptorParams);
  }

  return updatedData;
};
