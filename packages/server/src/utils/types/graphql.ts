import type { CookieOptions, Response as ExpressResponse, Request } from 'express';

import type { MappedEntity, VariablesPlainEntity } from './entities';
import type { Interceptors } from './interceptors';
import type { BaseUrl } from './server';
import type { Data } from './values';

export type GraphQLEntityName = 'cookies' | 'headers' | 'query' | 'variables';

export type GraphQLEntity<EntityName extends GraphQLEntityName = GraphQLEntityName> =
  EntityName extends 'variables' ? VariablesPlainEntity : MappedEntity;

export type GraphQLOperationType = 'mutation' | 'query';
export type GraphQLOperationName = string | RegExp;

export type GraphQLEntitiesByEntityName = {
  [EntityName in GraphQLEntityName]?: GraphQLEntity<EntityName>;
};

export interface GraphQLSettings {
  readonly delay?: number;
  readonly status?: number;
}

type GraphQLCookieValue = string | undefined;
type GraphQLHeaderValue = number | string | string[] | undefined;

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

export type GraphqlDataResponseFunction = (params: GraphQLParams) => Data | Promise<Data>;
export type GraphqlDataResponse = Data | GraphqlDataResponseFunction;

export interface GraphQLRouteConfig {
  data: GraphqlDataResponse;
  entities?: GraphQLEntitiesByEntityName;
  interceptors?: Interceptors<'graphql'>;
  settings?: GraphQLSettings;
}

interface BaseGraphQLRequestConfig {
  interceptors?: Interceptors<'graphql'>;
  operationType: GraphQLOperationType;
  routes: GraphQLRouteConfig[];
}

export interface OperationNameGraphQLRequestConfig extends BaseGraphQLRequestConfig {
  operationName: GraphQLOperationName;
}

interface QueryGraphQLRequestConfig extends BaseGraphQLRequestConfig {
  query: string;
}

export type GraphQLRequestConfig = OperationNameGraphQLRequestConfig | QueryGraphQLRequestConfig;

export interface GraphQLRequestArtifact {
  baseUrl: BaseUrl;
  componentRequestInterceptor?: Interceptors<'graphql'>['request'];
  componentResponseInterceptor?: Interceptors<'graphql'>['response'];
  config: GraphQLRouteConfig;
  key: string;
  operationName?: GraphQLOperationName;
  operationType: GraphQLOperationType;
  query?: string;
  requestRequestInterceptor?: Interceptors<'graphql'>['request'];
  requestResponseInterceptor?: Interceptors<'graphql'>['response'];
  routeRequestInterceptor?: Interceptors<'graphql'>['request'];
  routeResponseInterceptor?: Interceptors<'graphql'>['response'];
  serverRequestInterceptor?: Interceptors<'graphql'>['request'];
  serverResponseInterceptor?: Interceptors<'graphql'>['response'];
  weight: number;
}
