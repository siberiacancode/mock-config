import type { GraphQLEntity, GraphQLOperationType } from './graphql';
import type { RestMethod } from './rest';
import type { ApiType } from './shared';

export interface RestContext {
  method: RestMethod;
  type: Extract<ApiType, 'rest'>;
}

export interface GraphqlContext {
  eventName?: string;
  operationName?: string;
  operationType: GraphQLOperationType;
  query: string;
  type: Extract<ApiType, 'graphql'>;
  variables?: GraphQLEntity<'variables'>;
}

export type ApiContext = GraphqlContext | RestContext;

export interface WsEventContext {
  id: number;
  timestamp: number;
}
