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
  WsMessageEntitiesByEntityName,
  WsMessageParams,
  WsMessageRouteConfig,
  WsRequestConfig
} from '@/utils/types';

/* connection */

type WsConnectionHandler = (params: WsConnectionParams) => MaybePromise<Data>;
interface WsConnectionHandlerObject {
  handler: WsConnectionHandler;
  match?: WsConnectionEntitiesByEntityName;
}

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

/* message */

type WsMessageHandler = (params: WsMessageParams) => MaybePromise<Data>;
interface WsMessageHandlerObject {
  handler: WsMessageHandler;
  match?: WsMessageEntitiesByEntityName;
}

const createMessageRouteConfig = (
  config: WsMessageHandler | WsMessageHandlerObject
): WsMessageRouteConfig => {
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
    type: 'message',
    routes: [createMessageRouteConfig(config)]
  };
}

/* error */

type WsErrorHandler = (params: WsErrorParams) => MaybePromise<Data>;
interface WsErrorHandlerObject {
  handler: WsErrorHandler;
  match?: WsErrorEntitiesByEntityName;
}

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

/* close */

type WsCloseHandler = (params: WsCloseParams) => MaybePromise<Data>;
interface WsCloseHandlerObject {
  handler: WsCloseHandler;
  match?: WsCloseEntitiesByEntityName;
}

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
