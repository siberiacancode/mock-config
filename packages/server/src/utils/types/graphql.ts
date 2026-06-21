import type { CookieOptions, Response as ExpressResponse, Request } from 'express';
import type { ExecutionResult } from 'graphql';

import type { MappedEntity, VariablesEntity } from './entities';
import type { Interceptor } from './interceptors';
import type { BaseUrl } from './server';
import type { GraphQLOperationType } from './shared';
import type { MaybePromise } from './utils';
import type { PlainObject } from './values';

export type GraphQLEntityName = 'cookies' | 'headers' | 'queries' | 'variables';

export type GraphQLEntity<EntityName extends GraphQLEntityName = GraphQLEntityName> =
  EntityName extends 'variables' ? VariablesEntity : MappedEntity;

export type GraphQLIdentifier = string | RegExp;

export type GraphQLEntitiesByEntityName = {
  [EntityName in GraphQLEntityName]?: GraphQLEntity<EntityName>;
};

export interface GraphQLSettings {
  readonly delay?: number;
  readonly status?: number;
}

type GraphQLCookieValue = string | undefined;
type GraphQLHeaderValue = number | string | string[] | undefined;

export type GraphQLExecutionResult = ExecutionResult<Record<string, unknown>, PlainObject>;

export interface GraphQLParams<
  Query = Record<string, unknown>,
  Body = Record<string, unknown>,
  Params = Record<string, unknown>,
  Response = any
> {
  entities: GraphQLEntitiesByEntityName;
  request: Request<Params, Response, Body, Query>;
  response: ExpressResponse;
  appendHeader: (field: string, value?: string | string[]) => void;
  attachment: (filename: string) => void;
  broadcast: <Response>(response: Response) => void;
  clearCookie: (name: string, options?: CookieOptions) => void;
  getCookie: (name: string) => GraphQLCookieValue;
  getRequestHeader: (field: string) => GraphQLHeaderValue;
  getRequestHeaders: () => Record<string, GraphQLHeaderValue>;
  getResponseHeader: (field: string) => GraphQLHeaderValue;
  getResponseHeaders: () => Record<string, GraphQLHeaderValue>;
  next: () => void;
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  setDelay: (delay: number) => Promise<void>;
  setHeader: (field: string, value?: string | string[]) => void;
  setStatusCode: (statusCode: number) => void;
}

export type GraphQLDataResponseFunction = (
  params: GraphQLParams
) => MaybePromise<GraphQLExecutionResult>;
export type GraphQLDataResponse = GraphQLDataResponseFunction | GraphQLExecutionResult;

export interface GraphQLRouteConfig {
  data: GraphQLDataResponse;
  entities?: GraphQLEntitiesByEntityName;
  settings?: GraphQLSettings;
}

export interface GraphQLRequestConfig {
  identifier: GraphQLIdentifier;
  operationType: GraphQLOperationType;
  routes: GraphQLRouteConfig[];
}

export interface GraphQLRequestArtifact {
  baseUrl: BaseUrl;
  componentInterceptors?: Interceptor[];
  config: GraphQLRouteConfig;
  identifier: GraphQLIdentifier;
  operationType: GraphQLOperationType;
  serverInterceptors?: Interceptor[];
  weight: number;
}
