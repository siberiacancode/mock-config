import type { IncomingMessage } from 'node:http';

import type { Request } from 'express';
import type WebSocket from 'ws';

import type { MappedEntity, MessagePlainEntity } from './entities';
import type { Data } from './values';

interface WebSocketSettings {
  readonly delay?: number;
}

export interface WebSocketContext {
  connectionId: string;
  event?: string;
  message: {
    parsed?: Record<string, unknown>;
    raw: string;
  };
  socket: WebSocket;
}

export interface WebSocketRequestInterceptorParams {
  context: WebSocketContext;
  request: IncomingMessage;
  socket: WebSocket;
}

export type WebSocketRequestInterceptor = (
  params: WebSocketRequestInterceptorParams
) => Promise<void> | void;

export interface WebSocketResponseInterceptorParams extends WebSocketRequestInterceptorParams {
  setDelay: (delay: number) => Promise<void>;
}

export type WebSocketResponseInterceptor = (
  event: Data | undefined,
  params: WebSocketResponseInterceptorParams
) => Promise<Data | undefined> | Data | undefined;

export interface WebSocketInterceptors {
  request?: WebSocketRequestInterceptor;
  response?: WebSocketResponseInterceptor;
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
      entities: WebSocketEntitiesByEntityName,
      context: WebSocketContext
    ) => Data | Promise<Data>)
  | Data;

export interface WebSocketRouteConfig {
  event?: WebSocketEventResponse;
  entities?: WebSocketEntitiesByEntityName;
  interceptors?: WebSocketInterceptors;
  settings?: WebSocketSettings;
}

export interface WebSocketRequestConfig {
  event: RegExp | string;
  interceptors?: WebSocketInterceptors;
  routes: WebSocketRouteConfig[];
}

