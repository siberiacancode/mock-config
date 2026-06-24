import type { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import type { Interceptor } from '../../core/interceptors';
import type { MappedEntity } from './entities';
import type { GraphQLIdentifier } from './graphql';
import type { GraphqlTransportWsRouteConfig } from './graphql-transport-ws';
import type { BaseUrl } from './server';
import type { GraphQLTransportWsOperationType } from './shared';
import type { MaybePromise } from './utils';
import type { Data } from './values';

export interface WsFrameBinary {
  isBinary: true;
  raw: Buffer;
}
export interface WsFrameText {
  isBinary: false;
  raw: string;
}
export type WsFrame = WsFrameBinary | WsFrameText;

export type WsMessageParams = WsFrame & {
  broadcast: <Response = unknown>(response: Response) => void;
  socket: WebSocket;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
};

export type WsDataResponse = (params: WsMessageParams) => MaybePromise<Data>;

export interface WsSettings {
  readonly delay?: number;
}

export interface WsRawRouteConfig {
  data: WsDataResponse;
  settings?: WsSettings;
}

// wsIncoming wsOut
export interface WsConnectionParams {
  request: IncomingMessage;
  socket: WebSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type WsConnectionEntityName = 'cookies' | 'headers' | 'queries';
export type WsConnectionEntitiesByEntityName = {
  [EntityName in WsConnectionEntityName]?: MappedEntity;
};

export type WsConnectionDataResponse = (params: WsConnectionParams) => MaybePromise<Data>;

export interface WsConnectionRouteConfig {
  data: WsConnectionDataResponse;
  entities?: WsConnectionEntitiesByEntityName;
}

export interface WsRawRequestConfig {
  routes: WsRawRouteConfig[];
  type: 'raw';
}

export interface WsConnectionRequestConfig {
  routes: WsConnectionRouteConfig[];
  type: 'connection';
}

interface BaseWsRequestArtifact {
  baseUrl: BaseUrl;
  componentInterceptors?: Interceptor[];
  serverInterceptors?: Interceptor[];
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

export interface GraphqlTransportWsRequestArtifact extends BaseWsRequestArtifact {
  config: GraphqlTransportWsRouteConfig;
  identifier: GraphQLIdentifier;
  operationType: GraphQLTransportWsOperationType;
  type: 'graphql-ws';
}

export interface WsCloseParams {
  code: number;
  reason: string;
  request: IncomingMessage;
  socket: WebSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export interface WsErrorParams {
  error: Error;
  request: IncomingMessage;
  socket: WebSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type WsCloseDataResponse = (params: WsCloseParams) => MaybePromise<Data>;
export type WsErrorDataResponse = (params: WsErrorParams) => MaybePromise<Data>;

export interface WsCloseRouteConfig {
  data?: WsCloseDataResponse;
  entities?: WsConnectionEntitiesByEntityName;
  settings?: WsSettings;
}

export interface WsErrorRouteConfig {
  data?: WsErrorDataResponse;
  entities?: WsConnectionEntitiesByEntityName;
  settings?: WsSettings;
}

export interface WsCloseRequestConfig {
  routes: WsCloseRouteConfig[];
  type: 'close';
}

export interface WsErrorRequestConfig {
  routes: WsErrorRouteConfig[];
  type: 'error';
}

export type WsRequestConfig =
  | WsCloseRequestConfig
  | WsConnectionRequestConfig
  | WsErrorRequestConfig
  | WsRawRequestConfig;

export interface CloseWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsCloseRouteConfig;
  type: 'close';
}

export interface ErrorWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsErrorRouteConfig;
  type: 'error';
}

export type WsRequestArtifact =
  | CloseWsRequestArtifact
  | ConnectionWsRequestArtifact
  | ErrorWsRequestArtifact
  | GraphqlTransportWsRequestArtifact
  | RawWsRequestArtifact;
