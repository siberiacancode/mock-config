import type { Data, WsParams, WsRequestConfig } from '@/utils/types';

import { WS_RAW_PROTOCOL } from '@/utils/types';

type WsMessageHandler = (params: WsParams) => Data | Promise<Data>;

export const createWsMessageRequestConfig = (handler: WsMessageHandler): WsRequestConfig => ({
  protocol: WS_RAW_PROTOCOL,
  routes: [
    {
      data: handler
    }
  ]
});

export const ws = {
  message: createWsMessageRequestConfig
};
