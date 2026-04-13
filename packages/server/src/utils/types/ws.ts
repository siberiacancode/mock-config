import type { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import type { MappedEntity } from './entities';
import type { BaseUrl } from './server';
import type { Data } from './values';

export type WsType = 'connection' | 'raw';

export interface WsFrameBinary {
  isBinary: true;
  raw: Buffer;
}
export interface WsFrameText {
  isBinary: false;
  raw: string;
}
export type WsFrame = WsFrameBinary | WsFrameText;

export type WsParams = WsFrame & {
  emit: <Response = unknown>(response: Response) => void;
  socket: WebSocket;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
};

export type WsDataResponse = (params: WsParams) => Data | Promise<Data>;
export type WsData = Data | WsDataResponse;

export interface WsRawRouteConfig {
  data: WsData;
}

export interface WsConnectionParams {
  request: IncomingMessage;
  socket: WebSocket;
  emit: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type WsConnectionEntityName = 'cookies' | 'headers' | 'query';
export type WsConnectionEntitiesByEntityName = {
  [EntityName in WsConnectionEntityName]?: MappedEntity;
};

export type WsConnectionDataResponse = (
  params: WsConnectionParams
) => Data | Promise<Data> | Promise<undefined> | undefined;
export type WsConnectionData = Data | WsConnectionDataResponse;

export interface WsConnectionRouteConfig {
  data: WsConnectionData;
  entities?: WsConnectionEntitiesByEntityName;
}

export type WsRouteConfig = WsConnectionRouteConfig | WsRawRouteConfig;

export interface WsRawRequestConfig {
  routes: WsRawRouteConfig[];
  type: 'raw';
}

export interface WsConnectionRequestConfig {
  routes: WsConnectionRouteConfig[];
  type: 'connection';
}

export type WsRequestConfig = WsConnectionRequestConfig | WsRawRequestConfig;

interface BaseWsRequestArtifact {
  baseUrl: BaseUrl;
  componentRequestInterceptor?: any;
  componentResponseInterceptor?: any;
  weight: number;
}

export interface RawWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsRawRouteConfig;
  type: 'raw';
}

export interface ConnectionWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsConnectionRouteConfig;
  type: 'connection';
}

export type WsRequestArtifact = ConnectionWsRequestArtifact | RawWsRequestArtifact;
