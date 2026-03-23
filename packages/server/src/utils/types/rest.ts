import type { Request } from 'express';

import type { BodyPlainEntity, MappedEntity } from './entities';
import type { Interceptors } from './interceptors';
import type { BaseUrl } from './server';
import type { Data } from './values';

export type RestMethod = 'delete' | 'get' | 'options' | 'patch' | 'post' | 'put';
export type RestEntityName = 'body' | 'cookies' | 'headers' | 'params' | 'query';

export type RestEntity<EntityName extends RestEntityName = RestEntityName> =
  EntityName extends 'body' ? BodyPlainEntity : MappedEntity;

export type RestEntityNamesByMethod = {
  [key in RestMethod]: key extends 'delete' | 'get' | 'options'
    ? Exclude<RestEntityName, 'body'>
    : RestEntityName;
};
export type RestEntitiesByEntityName<Method extends RestMethod = RestMethod> = {
  [EntityName in RestEntityNamesByMethod[Method]]?: RestEntity<EntityName>;
};

interface RestSettings {
  readonly delay?: number;
  readonly polling?: boolean;
  readonly status?: number;
}

export type RestDataResponse<Method extends RestMethod = RestMethod> =
  | ((request: Request, entities: RestEntitiesByEntityName<Method>) => Data | Promise<Data>)
  | Data;

export type RestFileResponse = string;

export type RestRouteConfig<Method extends RestMethod> = (
  | {
      settings: RestSettings & { polling: true };
      queue: Array<
        | {
            time?: number;
            data: RestDataResponse<Method>;
          }
        | {
            time?: number;
            file: RestFileResponse;
          }
      >;
    }
  | {
      settings?: RestSettings & { polling?: false };
      data: RestDataResponse<Method>;
    }
  | {
      settings?: RestSettings & { polling?: false };
      file: RestFileResponse;
    }
) & { entities?: RestEntitiesByEntityName<Method>; interceptors?: Interceptors<'rest'> };

export type RestPathString = `/${string}`;

interface BaseRestRequestConfig<Method extends RestMethod> {
  interceptors?: Interceptors<'rest'>;
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
  componentRequestInterceptor?: Interceptors<'rest'>['request'];
  componentResponseInterceptor?: Interceptors<'rest'>['response'];
  config: RestRouteConfig<RestMethod>;
  key: string;
  method: RestMethod;
  path: RegExp | RestPathString;
  requestRequestInterceptor?: Interceptors<'rest'>['request'];
  requestResponseInterceptor?: Interceptors<'rest'>['response'];
  routeRequestInterceptor?: Interceptors<'rest'>['request'];
  routeResponseInterceptor?: Interceptors<'rest'>['response'];
  serverRequestInterceptor?: Interceptors<'rest'>['request'];
  serverResponseInterceptor?: Interceptors<'rest'>['response'];
  weight: number;
}
