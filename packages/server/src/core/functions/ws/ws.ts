import type {
  Data,
  MaybePromise,
  WsCloseParams,
  WsConnectionEntitiesByEntityName,
  WsConnectionParams,
  WsConnectionRouteConfig,
  WsErrorParams,
  WsMessageParams,
  WsRequestConfig
} from '@/utils/types';

type WsMessageHandler = (params: WsMessageParams) => MaybePromise<Data>;
type WsConnectionHandler = (params: WsConnectionParams) => MaybePromise<Data>;
type WsErrorHandler = (params: WsErrorParams) => MaybePromise<Data>;
type WsCloseHandler = (params: WsCloseParams) => MaybePromise<Data>;

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

export const createWsMessageRequestConfig = (handler: WsMessageHandler): WsRequestConfig => ({
  type: 'raw',
  routes: [
    {
      data: handler
    }
  ]
});

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

export const createWsErrorRequestConfig = (handler: WsErrorHandler): WsRequestConfig => ({
  type: 'error',
  routes: [
    {
      data: handler
    }
  ]
});

export const createWsCloseRequestConfig = (handler: WsCloseHandler): WsRequestConfig => ({
  type: 'close',
  routes: [
    {
      data: handler
    }
  ]
});

export const ws = {
  connection: createWsConnectionRequestConfig,
  message: createWsMessageRequestConfig,
  error: createWsErrorRequestConfig,
  close: createWsCloseRequestConfig
};
