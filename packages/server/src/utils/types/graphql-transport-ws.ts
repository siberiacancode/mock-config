import type { ExecutionResult, GraphQLError } from 'graphql';
import type { IncomingMessage } from 'node:http';
import type { RawData } from 'ws';

import type { WsEventContext } from './context';
import type { VariablesEntity } from './entities';
import type { GraphQLIdentifier, GraphQLTransportWsOperationType } from './graphql';
import type { MaybePromise } from './utils';
import type { PlainObject } from './values';
import type { WsSocket } from './ws';

export type GraphqlTransportWsOperationId = string;
export type GraphqlTransportWsMessagePayload = Record<string, unknown> | null;

export interface GraphqlTransportWsConnectionInitMessage {
  payload?: GraphqlTransportWsMessagePayload;
  type: 'connection_init';
}

export interface GraphqlTransportWsConnectionAckMessage {
  payload?: GraphqlTransportWsMessagePayload;
  type: 'connection_ack';
}

export interface GraphqlTransportWsPingMessage {
  payload?: GraphqlTransportWsMessagePayload;
  type: 'ping';
}

export interface GraphqlTransportWsPongMessage {
  payload?: GraphqlTransportWsMessagePayload;
  type: 'pong';
}

export interface GraphqlTransportWsSubscribeMessage {
  id: GraphqlTransportWsOperationId;
  payload: {
    query: string;
    operationName?: string | null;
    variables?: PlainObject | null;
    extensions?: PlainObject | null;
  };
  type: 'subscribe';
}

export type GraphqlTransportWsExecutionResult = ExecutionResult<
  Record<string, unknown>,
  PlainObject
>;

export interface GraphqlTransportWsNextMessage {
  id: GraphqlTransportWsOperationId;
  payload: GraphqlTransportWsExecutionResult;
  type: 'next';
}

export interface GraphqlTransportWsErrorMessage {
  id: GraphqlTransportWsOperationId;
  payload: ReadonlyArray<GraphQLError>;
  type: 'error';
}

export interface GraphqlTransportWsCompleteMessage {
  id: GraphqlTransportWsOperationId;
  type: 'complete';
}

export type GraphqlTransportWsMessage =
  | GraphqlTransportWsCompleteMessage
  | GraphqlTransportWsConnectionInitMessage
  | GraphqlTransportWsPingMessage
  | GraphqlTransportWsPongMessage
  | GraphqlTransportWsSubscribeMessage;

export interface GraphqlTransportWsEntitiesByEntityName {
  variables?: VariablesEntity;
}

export interface GraphqlTransportWsParams {
  entities: GraphqlTransportWsEntitiesByEntityName;
  event: WsEventContext;
  eventName?: string;
  operationName?: string;
  query?: string;
  raw: RawData;
  request: IncomingMessage;
  socket: WsSocket;
  variables?: PlainObject;
  complete: () => void;
  next: (payload: GraphqlTransportWsExecutionResult) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type GraphqlTransportWsDataResponse =
  | ((params: GraphqlTransportWsParams) => MaybePromise<GraphqlTransportWsExecutionResult>)
  | GraphqlTransportWsExecutionResult;

export interface GraphqlTransportWsSettings {
  readonly delay?: number;
}

export interface GraphqlTransportWsRouteConfig {
  data: GraphqlTransportWsDataResponse;
  entities?: GraphqlTransportWsEntitiesByEntityName;
  settings?: GraphqlTransportWsSettings;
}

export interface GraphqlTransportWsRequestConfig {
  identifier: GraphQLIdentifier;
  operationType: GraphQLTransportWsOperationType;
  routes: GraphqlTransportWsRouteConfig[];
}
