import type { WebSocket } from 'ws';

import type {
  Data,
  HttpResponseInterceptorHandlerParams,
  Interceptor,
  WsInterceptorMeta,
  WsResponseInterceptor,
  WsResponseInterceptorHandlerParams
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
  const setDelay: HttpResponseInterceptorHandlerParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const responseInterceptorFnParams: WsResponseInterceptorHandlerParams = {
    setDelay,
    socket,
    send,
    broadcast
  };

  let updatedData = data;

  const interceptorNames = ['ws.response.all', `ws.response.${meta.event}`];
  if (meta.event === 'message' && meta.messageType === 'raw') {
    interceptorNames.push('ws.response.raw');
  }
  if (meta.event === 'message' && meta.messageType === 'graphql-ws') {
    interceptorNames.push('graphql.response.subscription');
  }

  const responseInterceptors = [...componentInterceptors, ...serverInterceptors].filter(
    (interceptor): interceptor is WsResponseInterceptor =>
      interceptorNames.includes(interceptor[INTERCEPTOR_NAME])
  );

  for (const responseInterceptor of responseInterceptors) {
    updatedData = await responseInterceptor(updatedData, responseInterceptorFnParams);
  }
  return updatedData;
};
