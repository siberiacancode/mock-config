import type {
  Interceptor,
  WsCloseParams,
  WsErrorParams,
  WsEventContext,
  WsFrame,
  WsInterceptorMeta,
  WsRequestInterceptor,
  WsRequestInterceptorHandlerParams,
  WsSocket
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { sleep } from '../../../sleep';

interface CallWsRequestInterceptorsParams {
  code?: WsCloseParams['code'];
  error?: WsErrorParams['error'];
  event: WsEventContext;
  frame?: WsFrame;
  meta: WsInterceptorMeta;
  reason?: WsCloseParams['reason'];
  socket: WsSocket;
  broadcast: (data: unknown) => void;
  send: (data: unknown) => void;
}

export const callWsRequestInterceptors = async (
  {
    code,
    error,
    event,
    frame,
    meta,
    reason,
    socket,
    broadcast,
    send
  }: CallWsRequestInterceptorsParams,
  interceptors: Interceptor[]
) => {
  const setDelay: WsRequestInterceptorHandlerParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const requestInterceptorFnParams: WsRequestInterceptorHandlerParams = {
    code,
    frame,
    event,
    reason,
    error,
    broadcast,
    socket,
    send,
    setDelay
  };

  const interceptorNames = [
    'ws.request.all',
    `ws.request.${meta.event}`,
    ...(meta.event === 'message' && meta.messageType === 'raw' ? ['ws.request.raw'] : []),
    ...(meta.event === 'message' && meta.messageType === 'graphql-ws'
      ? ['graphql.request.subscription']
      : [])
  ];

  const requestInterceptors = interceptors.filter(
    (interceptor): interceptor is WsRequestInterceptor =>
      interceptorNames.includes(interceptor[INTERCEPTOR_NAME])
  );

  for (const requestInterceptor of requestInterceptors) {
    await requestInterceptor(requestInterceptorFnParams);
  }
};
