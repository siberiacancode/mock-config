import type { RawData, WebSocket } from 'ws';

import type { BodyPlainEntity } from './entities';
import type { BaseUrl } from './server';
import type { Data } from './values';

export const WS_MESSAGE_EVENT = Symbol.for('ws.message');

export type WsEventName = string | RegExp;
export type WsEntityName = 'meta' | 'payload';

export type WsEntity<EntityName extends WsEntityName = WsEntityName> = EntityName extends 'payload'
  ? BodyPlainEntity
  : EntityName extends 'meta'
    ? BodyPlainEntity
    : never;

export type WsEntitiesByEntityName = {
  [EntityName in WsEntityName]?: WsEntity<EntityName>;
};

export interface WsParams<Payload = unknown, Meta = Record<string, unknown>> {
  event: string;
  meta: Meta;
  payload: Payload;
  raw: RawData;
  socket: WebSocket;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}
export type WsDataResponse = ((params: WsParams) => Data | Promise<Data>) | Data;

export interface WsRouteConfig {
  data: WsDataResponse;
  entities?: WsEntitiesByEntityName;
}

export interface WsRequestConfig {
  event: WsEventName | typeof WS_MESSAGE_EVENT;
  routes: WsRouteConfig[];
}

export interface WsRequestArtifact {
  baseUrl: BaseUrl;
  config: WsRouteConfig;
  event: WsEventName | typeof WS_MESSAGE_EVENT;
  weight: number;
}
