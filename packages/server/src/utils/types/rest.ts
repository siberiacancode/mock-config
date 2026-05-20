import type { CookieOptions, Response as ExpressResponse, Request } from 'express';

import type { BodyEntity, MappedEntity } from './entities';
import type { Interceptors } from './interceptors';
import type { BaseUrl } from './server';
import type { Data } from './values';

export type RestMethod = 'delete' | 'get' | 'options' | 'patch' | 'post' | 'put';
export type RestEntityName = 'body' | 'cookies' | 'headers' | 'params' | 'queries';

export type RestEntity<EntityName extends RestEntityName = RestEntityName> =
  EntityName extends 'body' ? BodyEntity : MappedEntity;

export type RestEntityNamesByMethod = {
  [key in RestMethod]: key extends 'delete' | 'get' | 'options'
    ? Exclude<RestEntityName, 'body'>
    : RestEntityName;
};
export type RestEntitiesByEntityName<Method extends RestMethod = RestMethod> = {
  [EntityName in RestEntityNamesByMethod[Method]]?: RestEntity<EntityName>;
};

export interface RestSettings {
  readonly delay?: number;
  readonly status?: number;
}

type RestCookieValue = string | undefined;
type RestHeaderValue = number | string | string[] | undefined;

export interface RestParams<
  Method extends RestMethod = RestMethod,
  Query = Record<string, unknown>,
  Body = Record<string, unknown>,
  Params = Record<string, unknown>,
  Response = any
> {
  entities: RestEntitiesByEntityName<Method>;
  request: Request<Params, Response, Body, Query>;
  response: ExpressResponse;
  appendHeader: (field: string, value?: string | string[]) => void;
  attachment: (filename: string) => void;
  broadcast: <Response>(response: Response) => void;
  clearCookie: (name: string, options?: CookieOptions) => void;
  getCookie: (name: string) => RestCookieValue;
  getRequestHeader: (field: string) => RestHeaderValue;
  getRequestHeaders: () => Record<string, RestHeaderValue>;
  getResponseHeader: (field: string) => RestHeaderValue;
  getResponseHeaders: () => Record<string, RestHeaderValue>;
  next: () => void;
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  setDelay: (delay: number) => Promise<void>;
  setHeader: (field: string, value?: string | string[]) => void;
  setStatusCode: (statusCode: number) => void;
}

export type RestDataResponseFunction<Method extends RestMethod = RestMethod> = (
  params: RestParams<Method>
) => Data | Promise<Data>;
export type RestDataResponse<Method extends RestMethod = RestMethod> =
  | Data
  | RestDataResponseFunction<Method>;

export type RestFileResponse = string;

export interface RestRouteConfig<Method extends RestMethod> {
  data: RestDataResponse<Method>;
  entities?: RestEntitiesByEntityName<Method>;
  settings?: RestSettings;
}

export type RestPathString = `/${string}`;

export interface BaseRestRequestConfig<Method extends RestMethod> {
  method: Method;
  path: RegExp | RestPathString;
  routes: RestRouteConfig<Method>[];
}

type RestGetRequestConfig = BaseRestRequestConfig<'get'>;
type RestPostRequestConfig = BaseRestRequestConfig<'post'>;
type RestPutRequestConfig = BaseRestRequestConfig<'put'>;
type RestDeleteRequestConfig = BaseRestRequestConfig<'delete'>;
type RestPatchRequestConfig = BaseRestRequestConfig<'patch'>;
type RestOptionsRequestConfig = BaseRestRequestConfig<'options'>;
export type RestRequestConfig =
  | RestDeleteRequestConfig
  | RestGetRequestConfig
  | RestOptionsRequestConfig
  | RestPatchRequestConfig
  | RestPostRequestConfig
  | RestPutRequestConfig;

export interface RestRequestArtifact {
  baseUrl: BaseUrl;
  componentRequestInterceptor?: Interceptors['request'];
  componentResponseInterceptor?: Interceptors['response'];
  config: RestRouteConfig<RestMethod>;
  method: RestMethod;
  path: RegExp | RestPathString;
  serverRequestInterceptor?: Interceptors['request'];
  serverResponseInterceptor?: Interceptors['response'];
  weight: number;
}
