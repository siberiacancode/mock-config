import type { Request } from 'express';
import type { WebSocket } from 'ws';

import type {
  Data,
  HttpResponseInterceptorFnParams,
  Interceptor,
  WsResponseInterceptor,
  WsResponseInterceptorFnParams
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { sleep } from '../../../sleep';

interface CallWsResponseInterceptorsParams {
  componentInterceptors?: Interceptor[];
  data: Data;
  request: Request;
  serverInterceptors?: Interceptor[];
  socket: WebSocket;
  broadcast: (data: unknown) => void;
  send: (data: unknown) => void;
}

export const callWsResponseInterceptors = async ({
  data,
  request,
  componentInterceptors = [],
  serverInterceptors = [],
  socket,
  broadcast,
  send
}: CallWsResponseInterceptorsParams) => {
  const setDelay: HttpResponseInterceptorFnParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const responseInterceptorFnParams: WsResponseInterceptorFnParams = {
    setDelay,
    socket,
    send,
    broadcast
  };

  let updatedData = data;

  const interceptorNames = ['ws.response.all', `ws.response.${request.api.ws!.event}`];

  const responseInterceptors = [...componentInterceptors, ...serverInterceptors].filter(
    (interceptor): interceptor is WsResponseInterceptor =>
      interceptorNames.includes((interceptor as WsResponseInterceptor)[INTERCEPTOR_NAME])
  );

  for (const responseInterceptor of responseInterceptors) {
    updatedData = await responseInterceptor(updatedData, responseInterceptorFnParams);
  }
  return updatedData;
};
