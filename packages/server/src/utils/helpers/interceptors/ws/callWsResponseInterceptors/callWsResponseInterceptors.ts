import type { WebSocket } from 'ws';

import type {
  Data,
  HttpResponseInterceptorFnParams,
  Interceptor,
  WsInterceptorMeta,
  WsResponseInterceptor,
  WsResponseInterceptorFnParams
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { sleep } from '../../../sleep';

interface CallWsResponseInterceptorsParams {
  componentInterceptors?: Interceptor[];
  data: Data;
  meta: WsInterceptorMeta;
  serverInterceptors?: Interceptor[];
  socket: WebSocket;
  broadcast: (data: unknown) => void;
  send: (data: unknown) => void;
}

export const callWsResponseInterceptors = async ({
  componentInterceptors = [],
  data,
  meta,
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

  const interceptorNames = ['ws.response.all', `ws.response.${meta.event}`];
  if (meta.event === 'message' && meta.messageType === 'raw') {
    interceptorNames.push(`ws.response.raw`);
  }
  if (meta.event === 'message' && meta.messageType === 'graphql-ws') {
    interceptorNames.push('graphql.response.subscription');
  }

  const responseInterceptors = [...componentInterceptors, ...serverInterceptors].filter(
    (interceptor): interceptor is WsResponseInterceptor =>
      interceptorNames.includes((interceptor as WsResponseInterceptor)[INTERCEPTOR_NAME])
  );

  for (const responseInterceptor of responseInterceptors) {
    updatedData = await responseInterceptor(updatedData, responseInterceptorFnParams);
  }
  return updatedData;
};
