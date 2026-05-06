import type { RawData, WebSocket } from 'ws';

import type { VariablesEntity } from './entities';
import type { GraphQLOperationName } from './graphql';
import type { Data, PlainObject } from './values';
import type { GraphqlTransportWsEventName } from './ws';

export interface GraphqlTransportWsMessage {
  id?: string;
  payload?: {
    query?: string;
    operationName?: string;
    variables?: PlainObject;
  };
  type: 'connection_init' | 'ping' | 'subscribe';
}

export interface GraphqlTransportWsEntitiesByEntityName {
  variables?: VariablesEntity;
}

export interface GraphqlTransportWsParams {
  entities: GraphqlTransportWsEntitiesByEntityName;
  eventName?: string;
  operationName?: string;
  query?: string;
  raw: RawData;
  socket: WebSocket;
  variables?: PlainObject;
  next: (payload?: Data) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type GraphqlTransportWsDataResponse =
  | ((params: GraphqlTransportWsParams) => Data | Promise<Data>)
  | Data;

export interface GraphqlTransportWsSettings {
  readonly delay?: number;
}

export interface GraphqlTransportWsRouteConfig {
  data: GraphqlTransportWsDataResponse;
  entities?: GraphqlTransportWsEntitiesByEntityName;
  settings?: GraphqlTransportWsSettings;
}

export type GraphqlTransportWsOperationType = 'subscription';

export interface GraphqlTransportWsRequestConfig {
  eventName?: GraphqlTransportWsEventName;
  interceptors?: GraphqlTransportWsRequestInterceptors;
  operationName?: GraphQLOperationName;
  operationType: GraphqlTransportWsOperationType;
  query?: string;
  routes: GraphqlTransportWsRouteConfig[];
}

export interface GraphqlTransportWsRequestInterceptors {
  request?: GraphqlTransportWsRequestInterceptor;
  response?: GraphqlTransportWsResponseInterceptor;
}

export type GraphqlTransportWsRequestInterceptor = (
  params: GraphqlTransportWsParams
) => Promise<void> | void;

export type GraphqlTransportWsResponseInterceptor = (
  data: Data,
  params: GraphqlTransportWsParams
) => Data;
