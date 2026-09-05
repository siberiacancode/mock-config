import type {
  Data,
  MaybePromise,
  WsCloseEntitiesByEntityName,
  WsCloseParams,
  WsCloseRouteConfig,
  WsConnectionEntitiesByEntityName,
  WsConnectionParams,
  WsConnectionRouteConfig,
  WsErrorEntitiesByEntityName,
  WsErrorParams,
  WsErrorRouteConfig,
  WsMessageParams,
  WsRawEntitiesByEntityName,
  WsRawRouteConfig,
  WsRequestConfig
} from '@/utils/types';

type WsMessageHandler = (params: WsMessageParams) => MaybePromise<Data>;
type WsConnectionHandler = (params: WsConnectionParams) => MaybePromise<Data>;
type WsErrorHandler = (params: WsErrorParams) => MaybePromise<Data>;
type WsCloseHandler = (params: WsCloseParams) => MaybePromise<Data>;

interface WsMessageHandlerObject {
  handler: WsMessageHandler;
  match?: WsRawEntitiesByEntityName;
}

interface WsConnectionHandlerObject {
  handler: WsConnectionHandler;
  match?: WsConnectionEntitiesByEntityName;
}

interface WsErrorHandlerObject {
  handler: WsErrorHandler;
  match?: WsErrorEntitiesByEntityName;
}

interface WsCloseHandlerObject {
  handler: WsCloseHandler;
  match?: WsCloseEntitiesByEntityName;
}

const createRawRouteConfig = (
  config: WsMessageHandler | WsMessageHandlerObject
): WsRawRouteConfig => {
  if (typeof config === 'function') {
    return {
      data: config
    };
  }

  return {
    data: config.handler,
    entities: config.match
  };
};

const createConnectionRouteConfig = (
  config: WsConnectionHandler | WsConnectionHandlerObject
): WsConnectionRouteConfig => {
  if (typeof config === 'function') {
    return {
      data: config
    };
  }

  return {
    data: config.handler,
    entities: config.match
  };
};

const createErrorRouteConfig = (
  config: WsErrorHandler | WsErrorHandlerObject
): WsErrorRouteConfig => {
  if (typeof config === 'function') {
    return {
      data: config
    };
  }

  return {
    data: config.handler,
    entities: config.match
  };
};

const createCloseRouteConfig = (
  config: WsCloseHandler | WsCloseHandlerObject
): WsCloseRouteConfig => {
  if (typeof config === 'function') {
    return {
      data: config
    };
  }

  return {
    data: config.handler,
    entities: config.match
  };
};

export function createWsMessageRequestConfig(handler: WsMessageHandler): WsRequestConfig;
export function createWsMessageRequestConfig(config: WsMessageHandlerObject): WsRequestConfig;
export function createWsMessageRequestConfig(
  config: WsMessageHandler | WsMessageHandlerObject
): WsRequestConfig {
  return {
    type: 'raw',
    routes: [createRawRouteConfig(config)]
  };
}

export function createWsConnectionRequestConfig(handler: WsConnectionHandler): WsRequestConfig;
export function createWsConnectionRequestConfig(config: WsConnectionHandlerObject): WsRequestConfig;
export function createWsConnectionRequestConfig(
  config: WsConnectionHandler | WsConnectionHandlerObject
): WsRequestConfig {
  return {
    type: 'connection',
    routes: [createConnectionRouteConfig(config)]
  };
}

export function createWsErrorRequestConfig(handler: WsErrorHandler): WsRequestConfig;
export function createWsErrorRequestConfig(config: WsErrorHandlerObject): WsRequestConfig;
export function createWsErrorRequestConfig(
  config: WsErrorHandler | WsErrorHandlerObject
): WsRequestConfig {
  return {
    type: 'error',
    routes: [createErrorRouteConfig(config)]
  };
}

export function createWsCloseRequestConfig(handler: WsCloseHandler): WsRequestConfig;
export function createWsCloseRequestConfig(config: WsCloseHandlerObject): WsRequestConfig;
export function createWsCloseRequestConfig(
  config: WsCloseHandler | WsCloseHandlerObject
): WsRequestConfig {
  return {
    type: 'close',
    routes: [createCloseRouteConfig(config)]
  };
}

export const ws = {
  connection: createWsConnectionRequestConfig,
  message: createWsMessageRequestConfig,
  error: createWsErrorRequestConfig,
  close: createWsCloseRequestConfig
};
