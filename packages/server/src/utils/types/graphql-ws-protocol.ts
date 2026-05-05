import type { RawData, WebSocket } from 'ws';

import type { VariablesEntity } from './entities';
import type { GraphQLOperationName } from './graphql';
import type { Data, PlainObject } from './values';
import type { GraphQLWsProtocolEventName } from './ws';

export interface GraphQLWsProtocolMessage {
  id?: string;
  payload?: {
    query?: string;
    operationName?: string;
    variables?: PlainObject;
  };
  type: 'connection_init' | 'ping' | 'subscribe';
}

export interface GraphQLWsProtocolEntitiesByEntityName {
  variables?: VariablesEntity;
}

export interface GraphQLWsProtocolParams {
  entities: GraphQLWsProtocolEntitiesByEntityName;
  eventName?: string;
  operationName?: string;
  query?: string;
  raw: RawData;
  socket: WebSocket;
  variables?: PlainObject;
  next: (payload?: Data) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type GraphQLWsProtocolDataResponse =
  | ((params: GraphQLWsProtocolParams) => Data | Promise<Data>)
  | Data;

export interface GraphQLWsProtocolSettings {
  readonly delay?: number;
}

export interface GraphQLWsProtocolRouteConfig {
  data: GraphQLWsProtocolDataResponse;
  entities?: GraphQLWsProtocolEntitiesByEntityName;
  settings?: GraphQLWsProtocolSettings;
}

export type GraphQLWsProtocolOperationType = 'subscription';

export interface GraphQLWsProtocolRequestConfig {
  eventName?: GraphQLWsProtocolEventName;
  interceptors?: GraphQLWsProtocolRequestInterceptors;
  operationName?: GraphQLOperationName;
  operationType: GraphQLWsProtocolOperationType;
  query?: string;
  routes: GraphQLWsProtocolRouteConfig[];
}

export interface GraphQLWsProtocolRequestInterceptors {
  request?: GraphQLWsProtocolRequestInterceptor;
  response?: GraphQLWsProtocolResponseInterceptor;
}

export type GraphQLWsProtocolRequestInterceptor = (
  params: GraphQLWsProtocolParams
) => Promise<void> | void;

export type GraphQLWsProtocolResponseInterceptor = (
  data: Data,
  params: GraphQLWsProtocolParams
) => Data;
