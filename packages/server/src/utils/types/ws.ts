import type { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import type { WsEventContext } from './context';
import type {
  MappedEntity,
  WsCloseCodeEntity,
  WsCloseReasonEntity,
  WsDataEntity,
  WsIsBinaryEntity
} from './entities';
import type { GraphQLIdentifier, GraphQLTransportWsOperationType } from './graphql';
import type { GraphqlTransportWsRouteConfig } from './graphql-transport-ws';
import type { Interceptor } from './interceptors';
import type { BaseUrl } from './server';
import type { MaybePromise } from './utils';
import type { Data } from './values';

// ✅ important:
// @types/ws exports WebSocket via `export =`, so `declare module 'ws'` cannot reach the
// instance type — connection scoped fields are declared here and cast once in createWsRoute
export interface WsSocket extends WebSocket {
  id: number;
  timestamp: number;
}

export type WsEvent = 'close' | 'error' | 'message' | 'open';
export type WsMessageType = 'graphql-ws' | 'raw';

export interface WsFrameBinary {
  data: any;
  isBinary: true;
  raw: Buffer;
}
export interface WsFrameText {
  data: any;
  isBinary: false;
  raw: string;
}
export type WsFrame = WsFrameBinary | WsFrameText;

export interface WsSettings {
  readonly delay?: number;
}

export interface WsCloseEntitiesByEntityName {
  code?: WsCloseCodeEntity;
  reason?: WsCloseReasonEntity;
}

export type WsConnectionEntityName = 'cookies' | 'headers' | 'queries';
export type WsConnectionEntitiesByEntityName = {
  [EntityName in WsConnectionEntityName]?: MappedEntity;
};

export interface WsRawEntitiesByEntityName {
  data?: WsDataEntity;
  isBinary?: WsIsBinaryEntity;
}

export interface WsCloseParams {
  code: number;
  event: WsEventContext;
  reason: string;
  request: IncomingMessage;
  socket: WsSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
export type WsCloseDataResponse = (params: WsCloseParams) => MaybePromise<Data>;

export interface WsConnectionParams {
  event: WsEventContext;
  request: IncomingMessage;
  socket: WsSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
export type WsConnectionDataResponse = (params: WsConnectionParams) => MaybePromise<Data>;

export interface WsErrorParams {
  error: Error;
  event: WsEventContext;
  request: IncomingMessage;
  socket: WsSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
type WsErrorDataResponse = (params: WsErrorParams) => MaybePromise<Data>;

export type WsMessageParams = WsFrame & {
  event: WsEventContext;
  request: IncomingMessage;
  broadcast: <Response = unknown>(response: Response) => void;
  socket: WsSocket;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
};
export type WsDataResponse = (params: WsMessageParams) => MaybePromise<Data>;

export interface WsCloseRouteConfig {
  data: WsCloseDataResponse;
  entities?: WsCloseEntitiesByEntityName;
  settings?: WsSettings;
}
export interface WsConnectionRouteConfig {
  data: WsConnectionDataResponse;
  entities?: WsConnectionEntitiesByEntityName;
}
export interface WsErrorRouteConfig {
  data: WsErrorDataResponse;
  settings?: WsSettings;
}
export interface WsRawRouteConfig {
  data: WsDataResponse;
  entities?: WsRawEntitiesByEntityName;
  settings?: WsSettings;
}
export type WsRouteConfig =
  | WsCloseRouteConfig
  | WsConnectionRouteConfig
  | WsErrorRouteConfig
  | WsRawRouteConfig;

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
