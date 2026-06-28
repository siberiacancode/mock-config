import type { WebSocket } from 'ws';

import type {
  Interceptor,
  WsInterceptorMeta,
  WsRequestInterceptor,
  WsRequestInterceptorFnParams
} from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

import { sleep } from '../../../sleep';

interface CallWsRequestInterceptorsParams {
  interceptors: Interceptor[];
  meta: WsInterceptorMeta;
  socket: WebSocket;
  broadcast: (data: unknown) => void;
  send: (data: unknown) => void;
}

export const callWsRequestInterceptors = async ({
  interceptors,
  meta,
  socket,
  broadcast,
  send
}: CallWsRequestInterceptorsParams) => {
  const setDelay: WsRequestInterceptorFnParams['setDelay'] = async (delay) => {
    await sleep(delay);
  };

  const requestInterceptorFnParams: WsRequestInterceptorFnParams = {
    broadcast,
    socket,
    send,
    setDelay
  };

  const interceptorNames = ['ws.request.all', `ws.request.${meta.event}`];
  if (meta.event === 'message' && meta.messageType === 'raw') {
    interceptorNames.push('ws.request.raw');
  }
  if (meta.event === 'message' && meta.messageType === 'graphql-ws') {
    interceptorNames.push('graphql.request.subscription');
  }

  const requestInterceptors = interceptors.filter(
    (interceptor): interceptor is WsRequestInterceptor =>
      interceptorNames.includes((interceptor as WsRequestInterceptor)[INTERCEPTOR_NAME])
  );

  for (const requestInterceptor of requestInterceptors) {
    await requestInterceptor(requestInterceptorFnParams);
  }
};
