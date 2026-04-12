import type { RawData, WebSocket } from 'ws';

import type { BaseUrl } from './server';
import type { Data } from './values';

export const WS_RAW_PROTOCOL = 'raw' as const;
export type WsProtocol = typeof WS_RAW_PROTOCOL;

export interface WsParams {
  raw: RawData;
  socket: WebSocket;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
export type WsDataResponse = (params: WsParams) => Data | Promise<Data>;

export interface WsRouteConfig {
  data: WsDataResponse;
}

export interface WsRequestConfig {
  protocol: WsProtocol;
  routes: WsRouteConfig[];
}

interface BaseWsRequestArtifact {
  baseUrl: BaseUrl;
  componentRequestInterceptor?: ((params: any) => Promise<void> | void) | undefined;
  componentResponseInterceptor?: ((data: any, params: any) => any) | undefined;
  weight: number;
}

export interface WsRequestArtifact extends BaseWsRequestArtifact {
  config: WsRouteConfig;
  protocol: WsProtocol;
}
