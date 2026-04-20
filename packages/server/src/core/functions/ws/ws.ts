import type {
  Data,
  WsConnectionEntitiesByEntityName,
  WsConnectionParams,
  WsConnectionRouteConfig,
  WsParams,
  WsRequestConfig
} from '@/utils/types';

type WsMessageHandler = (params: WsParams) => Data | Promise<Data>;
type WsConnectionHandler = (params: WsConnectionParams) => Data | Promise<Data>;

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

export const ws = {
  connection: createWsConnectionRequestConfig,
  message: createWsMessageRequestConfig
};
