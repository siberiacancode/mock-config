import type { Request } from 'express';
import type { WebSocket } from 'ws';

import type {
  Interceptor,
  WsRequestInterceptor,
  WsRequestInterceptorFnParams
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { sleep } from '../../../sleep';

interface CallWsRequestInterceptorsParams {
  interceptors: Interceptor[];
  request: Request;
  socket: WebSocket;
  broadcast: (data: unknown) => void;
  send: (data: unknown) => void;
}

export const callWsRequestInterceptors = async ({
  interceptors,
  request,
  socket,
  broadcast,
  send
}: CallWsRequestInterceptorsParams) => {
  const setDelay: WsRequestInterceptorFnParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };
  // const frame: WsFrame = isBinary
  //   ? { isBinary: true, raw: raw as Buffer }
  //   : { isBinary: false, raw: raw.toString() };
  const requestInterceptorFnParams: WsRequestInterceptorFnParams = {
    // ...frame,
    broadcast,
    socket,
    send,
    setDelay
  };

  const interceptorNames = ['ws.request.all', `ws.request.${request.api.ws!.event}`];

  const requestInterceptors = interceptors.filter(
    (interceptor): interceptor is WsRequestInterceptor =>
      interceptorNames.includes((interceptor as WsRequestInterceptor)[INTERCEPTOR_NAME])
  );

  for (const requestInterceptor of requestInterceptors) {
    await requestInterceptor(requestInterceptorFnParams);
  }
};
