import type { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import type { WsEventContext } from './context';
import type {
  MappedEntity,
  WsCloseCodeEntity,
  WsCloseReasonEntity,
  WsDataEntity,
  WsErrorCodeEntity,
  WsErrorMessageEntity,
  WsIsBinaryEntity
} from './entities';
import type { GraphQLIdentifier, GraphQLTransportWsOperationType } from './graphql';
import type { GraphqlTransportWsRouteConfig } from './graphql-transport-ws';
import type { Interceptor } from './interceptors';
import type { BaseUrl } from './server';
import type { MaybePromise } from './utils';
import type { Data } from './values';

/* shared */

// ✅ important:
// @types/ws exports WebSocket via `export =`, so `declare module 'ws'` cannot reach the
// instance type — connection scoped fields are declared here and cast once in createWsRoute
export interface WsSocket extends WebSocket {
  context: Record<string, any>;
  id: number;
  timestamp: number;
}

export type WsEvent = 'close' | 'error' | 'message' | 'open';
export type WsMessageType = 'graphql-ws' | 'raw';

export interface WsSettings {
  readonly delay?: number;
}

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

interface BaseWsRequestArtifact {
  baseUrl: BaseUrl;
  componentInterceptors?: Interceptor[];
  serverInterceptors?: Interceptor[];
  weight: number;
}

/* connection */

export type WsConnectionEntityName = 'cookies' | 'headers' | 'queries';
export type WsConnectionEntitiesByEntityName = {
  [EntityName in WsConnectionEntityName]?: MappedEntity;
};

export interface WsConnectionParams {
  event: WsEventContext;
  handshake: IncomingMessage;
  socket: WsSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
export type WsConnectionDataResponse = (params: WsConnectionParams) => MaybePromise<Data>;

export interface WsConnectionRouteConfig {
  data: WsConnectionDataResponse;
  entities?: WsConnectionEntitiesByEntityName;
}
interface WsConnectionRequestConfig {
  routes: WsConnectionRouteConfig[];
  type: 'connection';
}
export interface ConnectionWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsConnectionRouteConfig;
  type: 'connection';
}

/* message */

export interface WsMessageEntitiesByEntityName {
  data?: WsDataEntity;
  isBinary?: WsIsBinaryEntity;
}

export type WsMessageParams = WsFrame & {
  event: WsEventContext;
  handshake: IncomingMessage;
  broadcast: <Response = unknown>(response: Response) => void;
  socket: WsSocket;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
};
export type WsMessageDataResponse = (params: WsMessageParams) => MaybePromise<Data>;

export interface WsMessageRouteConfig {
  data: WsMessageDataResponse;
  entities?: WsMessageEntitiesByEntityName;
  settings?: WsSettings;
}
interface WsMessageRequestConfig {
  routes: WsMessageRouteConfig[];
  type: 'message';
}
export interface MessageWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsMessageRouteConfig;
  type: 'message';
}

/* error */

export interface WsErrorEntitiesByEntityName {
  // ✅ important:
  // ws attaches a stable code to protocol errors (WS_ERR_INVALID_UTF8, ...)
  // and socket errors carry the node one (ECONNRESET, ...), unlike the message text
  code?: WsErrorCodeEntity;
  message?: WsErrorMessageEntity;
}

export interface WsErrorParams {
  error: NodeJS.ErrnoException;
  event: WsEventContext;
  handshake: IncomingMessage;
  socket: WsSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
export type WsErrorDataResponse = (params: WsErrorParams) => MaybePromise<Data>;

export interface WsErrorRouteConfig {
  data: WsErrorDataResponse;
  entities?: WsErrorEntitiesByEntityName;
  settings?: WsSettings;
}
interface WsErrorRequestConfig {
  routes: WsErrorRouteConfig[];
  type: 'error';
}
export interface ErrorWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsErrorRouteConfig;
  type: 'error';
}

/* close */

export interface WsCloseEntitiesByEntityName {
  code?: WsCloseCodeEntity;
  reason?: WsCloseReasonEntity;
}

export interface WsCloseParams {
  code: number;
  event: WsEventContext;
  handshake: IncomingMessage;
  reason: string;
  socket: WsSocket;
  broadcast: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
export type WsCloseDataResponse = (params: WsCloseParams) => MaybePromise<Data>;

export interface WsCloseRouteConfig {
  data: WsCloseDataResponse;
  entities?: WsCloseEntitiesByEntityName;
  settings?: WsSettings;
}
interface WsCloseRequestConfig {
  routes: WsCloseRouteConfig[];
  type: 'close';
}
export interface CloseWsRequestArtifact extends BaseWsRequestArtifact {
  config: WsCloseRouteConfig;
  type: 'close';
}

/* graphql-ws */

export interface GraphqlTransportWsRequestArtifact extends BaseWsRequestArtifact {
  config: GraphqlTransportWsRouteConfig;
  identifier: GraphQLIdentifier;
  operationType: GraphQLTransportWsOperationType;
  type: 'graphql-ws';
}

/* unions */

export type WsRouteConfig =
  | WsCloseRouteConfig
  | WsConnectionRouteConfig
  | WsErrorRouteConfig
  | WsMessageRouteConfig;

export type WsRequestConfig =
  | WsCloseRequestConfig
  | WsConnectionRequestConfig
  | WsErrorRequestConfig
  | WsMessageRequestConfig;

export type WsRequestArtifact =
  | CloseWsRequestArtifact
  | ConnectionWsRequestArtifact
  | ErrorWsRequestArtifact
  | GraphqlTransportWsRequestArtifact
  | MessageWsRequestArtifact;
