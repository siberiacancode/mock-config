import type { GraphQLEntity } from './graphql';
import type { ApiType, GraphQLOperationType, RestMethod, WsEvent } from './shared';

export interface RestContext {
  method: RestMethod;
  type: Extract<ApiType, 'rest'>;
}

export interface GraphqlContext {
  operationName?: string;
  operationType: GraphQLOperationType;
  query: string;
  type: Extract<ApiType, 'graphql'>;
  variables?: GraphQLEntity<'variables'>;
}

export interface WsContext {
  event: WsEvent;
  type: Extract<ApiType, 'ws'>;
}

export type ApiContext = GraphqlContext | RestContext | WsContext;
