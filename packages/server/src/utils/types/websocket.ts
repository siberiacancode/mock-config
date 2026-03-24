import type { Request } from "express";

import type { MappedEntity, MessagePlainEntity } from "./entities";
import type { BaseUrl } from "./server";
import type { Data } from "./values";
import type { Interceptors } from './interceptors';

interface WebSocketSettings {
  readonly delay?: number;
}

export type WebSocketEntitiesByEntityName = {
  cookies?: MappedEntity;
  headers?: MappedEntity;
  message?: MessagePlainEntity;
  query?: MappedEntity;
};

export type WebSocketEventResponse =
  | ((
      request: Request,
      entities: WebSocketEntitiesByEntityName
    ) => Data | Promise<Data>)
  | Data;

export interface WebSocketRouteConfig {
  event?: WebSocketEventResponse;
  entities?: WebSocketEntitiesByEntityName;
  interceptors?: Interceptors<"websocket">;
  settings?: WebSocketSettings;
}

export interface WebSocketRequestConfig {
  event: RegExp | string;
  interceptors?: Interceptors<"websocket">;
  routes: WebSocketRouteConfig[];
}

export interface WebSocketRequestArtifact {
  baseUrl: BaseUrl;
  componentRequestInterceptor?: Interceptors<"websocket">["request"];
  componentResponseInterceptor?: Interceptors<"websocket">["response"];
  config: WebSocketRouteConfig;
  event: RegExp | string;
  key: string;
  requestRequestInterceptor?: Interceptors<"websocket">["request"];
  requestResponseInterceptor?: Interceptors<"websocket">["response"];
  routeRequestInterceptor?: Interceptors<"websocket">["request"];
  routeResponseInterceptor?: Interceptors<"websocket">["response"];
  serverRequestInterceptor?: Interceptors<"websocket">["request"];
  serverResponseInterceptor?: Interceptors<"websocket">["response"];
  weight: number;
}
