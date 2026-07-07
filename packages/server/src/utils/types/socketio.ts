import type { IncomingMessage } from 'node:http';
import type { Socket } from 'socket.io';

import type { MappedEntity } from './entities';
import type { BaseUrl } from './server';
import type { MaybePromise } from './utils';
import type { Data } from './values';

export type SocketIoAcknowledgement = (...args: unknown[]) => void;
export type SocketIoEventName = string;

export interface SocketIoParams {
  ack?: SocketIoAcknowledgement;
  args: unknown[];
  event: SocketIoEventName;
  socket: Socket;
  broadcast: <Response = unknown>(response: Response) => void;
  emit: <Response = unknown>(event: SocketIoEventName, response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type SocketIoDataResponse = (params: SocketIoParams) => MaybePromise<Data>;
export type SocketIoRequestInterceptor = (params: SocketIoParams) => MaybePromise<void>;
export type SocketIoResponseInterceptor<ResponseData = Data> = (
  data: ResponseData,
  params: SocketIoParams
) => MaybePromise<Data>;

export interface SocketIoSettings {
  readonly delay?: number;
}

export interface SocketIoRawRouteConfig {
  data: SocketIoDataResponse;
  event: SocketIoEventName;
  settings?: SocketIoSettings;
}

export type SocketIoConnectionRequest = IncomingMessage & {
  cookies: Record<string, string>;
  queries: Record<string, string | string[]>;
};

export interface SocketIoConnectionParams {
  request: SocketIoConnectionRequest;
  socket: Socket;
  broadcast: <Response = unknown>(response: Response) => void;
  send: <Response = unknown>(response: Response) => void;
  setDelay: (delay: number) => Promise<void>;
}

export type SocketIoConnectionEntityName = 'cookies' | 'headers' | 'queries';
export type SocketIoConnectionEntitiesByEntityName = {
  [EntityName in SocketIoConnectionEntityName]?: MappedEntity;
};

export type SocketIoConnectionDataResponse = (
  params: SocketIoConnectionParams
) => MaybePromise<Data>;

export interface SocketIoConnectionRouteConfig {
  data: SocketIoConnectionDataResponse;
  entities?: SocketIoConnectionEntitiesByEntityName;
}

export interface SocketIoRawRequestConfig {
  routes: SocketIoRawRouteConfig[];
  transportType: 'socket.io';
  type: 'message';
}

export interface SocketIoConnectionRequestConfig {
  routes: SocketIoConnectionRouteConfig[];
  transportType: 'socket.io';
  type: 'connection';
}

export type SocketIoRequestConfig = SocketIoConnectionRequestConfig | SocketIoRawRequestConfig;

interface BaseSocketIoRequestArtifact {
  baseUrl: BaseUrl;
  componentRequestInterceptor?: SocketIoRequestInterceptor;
  componentResponseInterceptor?: SocketIoResponseInterceptor;
  weight: number;
}

export interface SocketIoRawRequestArtifact extends BaseSocketIoRequestArtifact {
  config: SocketIoRawRouteConfig;
  type: 'message';
}

export interface SocketIoConnectionRequestArtifact extends BaseSocketIoRequestArtifact {
  config: SocketIoConnectionRouteConfig;
  type: 'connection';
}
export type SocketIoRequestArtifact =
  | SocketIoConnectionRequestArtifact
  | SocketIoRawRequestArtifact;
