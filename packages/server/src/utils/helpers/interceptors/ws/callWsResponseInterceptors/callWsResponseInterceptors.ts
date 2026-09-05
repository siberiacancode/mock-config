import type {
  Data,
  HttpResponseInterceptorHandlerParams,
  Interceptor,
  WsCloseParams,
  WsEventContext,
  WsFrame,
  WsInterceptorMeta,
  WsResponseInterceptor,
  WsResponseInterceptorHandlerParams,
  WsSocket
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { sleep } from '../../../sleep';

interface CallWsResponseInterceptorsParams {
  code?: WsCloseParams['code'];
  componentInterceptors?: Interceptor[];
  data: Data;
  event: WsEventContext;
  frame?: WsFrame;
  meta: WsInterceptorMeta;
  reason?: WsCloseParams['reason'];
  serverInterceptors?: Interceptor[];
  socket: WsSocket;
  broadcast: (data: unknown) => void;
  send: (data: unknown) => void;
}

export const callWsResponseInterceptors = async ({
  code,
  componentInterceptors = [],
  data,
  frame,
  event,
  meta,
  reason,
  serverInterceptors = [],
  socket,
  broadcast,
  send
}: CallWsResponseInterceptorsParams) => {
  const setDelay: HttpResponseInterceptorHandlerParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const responseInterceptorFnParams: WsResponseInterceptorHandlerParams = {
    code,
    frame,
    event,
    reason,
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
