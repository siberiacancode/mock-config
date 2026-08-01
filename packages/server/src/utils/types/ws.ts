import type { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import type { MappedEntity } from './entities';
import type { GraphQLIdentifier, GraphQLTransportWsOperationType } from './graphql';
import type { GraphqlTransportWsRouteConfig } from './graphql-transport-ws';
import type { Interceptor } from './interceptors';
import type { BaseUrl } from './server';
import type { MaybePromise } from './utils';
import type { Data } from './values';

export type WsEvent = 'close' | 'error' | 'message' | 'open';
export type WsMessageType = 'graphql-ws' | 'raw';

export interface WsFrameBinary {
  isBinary: true;
  raw: Buffer;
}
export interface WsFrameText {
  isBinary: false;
  raw: string;
}
export type WsFrame = WsFrameBinary | WsFrameText;

export interface WsSettings {
  readonly delay?: number;
}

export type WsConnectionEntityName = 'cookies' | 'headers' | 'queries';
export type WsConnectionEntitiesByEntityName = {
  [EntityName in WsConnectionEntityName]?: MappedEntity;
};

export interface WsCloseParams {
  code: number;
  reason: string;
  request: IncomingMessage;
  socket: WebSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
export type WsCloseDataResponse = (params: WsCloseParams) => MaybePromise<Data>;

export interface WsConnectionParams {
  request: IncomingMessage;
  socket: WebSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
export type WsConnectionDataResponse = (params: WsConnectionParams) => MaybePromise<Data>;

export interface WsErrorParams {
  error: Error;
  request: IncomingMessage;
  socket: WebSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
type WsErrorDataResponse = (params: WsErrorParams) => MaybePromise<Data>;

export type WsMessageParams = WsFrame & {
  broadcast: <Response = unknown>(response: Response) => void;
  socket: WebSocket;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
};
export type WsDataResponse = (params: WsMessageParams) => MaybePromise<Data>;

interface WsCloseRouteConfig {
  data: WsCloseDataResponse;
  settings?: WsSettings;
}
export interface WsConnectionRouteConfig {
  data: WsConnectionDataResponse;
  entities?: WsConnectionEntitiesByEntityName;
}
interface WsErrorRouteConfig {
  data: WsErrorDataResponse;
  settings?: WsSettings;
}
interface WsRawRouteConfig {
  data: WsDataResponse;
  settings?: WsSettings;
}

interface WsCloseRequestConfig {
  routes: WsCloseRouteConfig[];
  type: 'close';
}
interface WsConnectionRequestConfig {
  routes: WsConnectionRouteConfig[];
  type: 'connection';
}
interface WsErrorRequestConfig {
  routes: WsErrorRouteConfig[];
  type: 'error';
}
interface WsRawRequestConfig {
  routes: WsRawRouteConfig[];
  type: 'raw';
}
export type WsRequestConfig =
  | WsCloseRequestConfig
  | WsConnectionRequestConfig
  | WsErrorRequestConfig
  | WsRawRequestConfig;

interface BaseWsRequestArtifact {
  baseUrl: BaseUrl;
  componentInterceptors?: Interceptor[];
  serverInterceptors?: Interceptor[];
  weight: number;
}
export interface CloseWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsCloseRouteConfig;
  type: 'close';
}
export interface ConnectionWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsConnectionRouteConfig;
  type: 'connection';
}
export interface ErrorWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsErrorRouteConfig;
  type: 'error';
}
export interface GraphqlTransportWsRequestArtifact extends BaseWsRequestArtifact {
  config: GraphqlTransportWsRouteConfig;
  identifier: GraphQLIdentifier;
  operationType: GraphQLTransportWsOperationType;
  type: 'graphql-ws';
}
export interface RawWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsRawRouteConfig;
  type: 'raw';
}
export type WsRequestArtifact =
  | CloseWsRequestArtifact
  | ConnectionWsRequestArtifact
  | ErrorWsRequestArtifact
  | GraphqlTransportWsRequestArtifact
  | RawWsRequestArtifact;
