import type { Buffer } from 'node:buffer';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';

import type { MappedEntity } from './entities';
import type { GraphQLIdentifier } from './graphql';
import type {
  GraphqlTransportWsOperationType,
  GraphqlTransportWsRouteConfig
} from './graphql-transport-ws';
import type { BaseUrl } from './server';
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

export type WsParams = WsFrame & {
  broadcast: <Response = unknown>(response: Response) => void;
  socket: WebSocket;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
};

export type WsDataResponse = (params: WsParams) => MaybePromise<Data>;

export interface WsSettings {
  readonly delay?: number;
}

export interface WsRawRouteConfig {
  data: WsDataResponse;
  settings?: WsSettings;
}

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

export interface GraphqlTransportWsRequestArtifact extends BaseWsRequestArtifact {
  config: GraphqlTransportWsRouteConfig;
  identifier: GraphQLIdentifier;
  operationType: GraphqlTransportWsOperationType;
  type: 'graphql-ws';
}

export type WsRequestArtifact =
  | ConnectionWsRequestArtifact
  | GraphqlTransportWsRequestArtifact
  | RawWsRequestArtifact;
