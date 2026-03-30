import type { WebSocket } from 'ws';

import type { BodyPlainEntity } from './entities';
import type { BaseUrl } from './server';
import type { Data } from './values';

export type WsEventName = string | RegExp;
export type WsEntityName = 'payload';

export type WsEntity<EntityName extends WsEntityName = WsEntityName> = EntityName extends 'payload'
  ? BodyPlainEntity
  : never;

export type WsEntitiesByEntityName = {
  [EntityName in WsEntityName]?: WsEntity<EntityName>;
};

export interface WsParams<Payload = unknown, Response = any> {
  event: string;
  payload: Payload;
  socket: WebSocket;
  send: (response: Response) => void;
}

export type WsDataResponse = ((params: WsParams) => Data | Promise<Data>) | Data;

export interface WsRouteConfig {
  data: WsDataResponse;
  entities?: WsEntitiesByEntityName;
}

export interface WsRequestConfig {
  event: WsEventName;
  routes: WsRouteConfig[];
}

export interface WsRequestArtifact {
  baseUrl: BaseUrl;
  componentRequestInterceptor?: ((params: WsParams) => Promise<void> | void) | undefined;
  componentResponseInterceptor?: ((data: any, params: Omit<WsParams, 'send'>) => any) | undefined;
  config: WsRouteConfig;
  event: WsEventName;
  key: string;
  weight: number;
}
