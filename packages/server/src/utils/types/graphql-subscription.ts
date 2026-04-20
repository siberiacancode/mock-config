import type { RawData, WebSocket } from 'ws';

import type { VariablesPlainEntity } from './entities';
import type { GraphQLOperationName } from './graphql';
import type { Data, PlainObject } from './values';

export interface GraphQLSubscriptionEntitiesByEntityName {
  variables?: VariablesPlainEntity;
}

export interface GraphQLSubscriptionParams {
  entities: GraphQLSubscriptionEntitiesByEntityName;
  operationName: string;
  query: string;
  raw: RawData;
  socket: WebSocket;
  variables?: PlainObject;
  next: (payload?: Data) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type GraphQLSubscriptionDataResponse =
  | ((params: GraphQLSubscriptionParams) => Data | Promise<Data>)
  | Data;

export interface GraphQLSubscriptionSettings {
  readonly delay?: number;
}

export interface GraphQLSubscriptionRouteConfig {
  data: GraphQLSubscriptionDataResponse;
  entities?: GraphQLSubscriptionEntitiesByEntityName;
  settings?: GraphQLSubscriptionSettings;
}

export type GraphQLSubscriptionOperationType = 'subscription';

export interface GraphQLSubscriptionRequestConfig {
  interceptors?: GraphQLSubscriptionRequestInterceptors;
  operationName?: GraphQLOperationName;
  operationType: GraphQLSubscriptionOperationType;
  query?: string;
  routes: GraphQLSubscriptionRouteConfig[];
}

export interface GraphQLSubscriptionRequestInterceptors {
  request?: GraphQLSubscriptionRequestInterceptor;
  response?: GraphQLSubscriptionResponseInterceptor;
}

export type GraphQLSubscriptionRequestInterceptor = (
  params: GraphQLSubscriptionParams
) => Promise<void> | void;

export type GraphQLSubscriptionResponseInterceptor = (
  data: Data,
  params: GraphQLSubscriptionParams
) => Data;
