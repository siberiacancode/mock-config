import type {
  Data,
  MaybePromise,
  SocketIoConnectionEntitiesByEntityName,
  SocketIoConnectionParams,
  SocketIoConnectionRouteConfig,
  SocketIoEventName,
  SocketIoParams,
  SocketIoRawRouteConfig,
  SocketIoRequestConfig
} from '@/utils/types';

type SocketIoMessageHandler = (params: SocketIoParams) => MaybePromise<Data>;
type SocketIoConnectionHandler = (params: SocketIoConnectionParams) => MaybePromise<Data>;

interface SocketIoConnectionHandlerObject {
  handler: SocketIoConnectionHandler;
  match?: SocketIoConnectionEntitiesByEntityName;
}

interface SocketIoMessageHandlerObject {
  event: SocketIoEventName;
  handler: SocketIoMessageHandler;
}

const createMessageRouteConfig = (
  event: SocketIoEventName,
  handler: SocketIoMessageHandler
): SocketIoRawRouteConfig => ({
  data: handler,
  event
});

const createConnectionRouteConfig = (
  config: SocketIoConnectionHandler | SocketIoConnectionHandlerObject
): SocketIoConnectionRouteConfig => {
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

export function createSocketIoMessageRequestConfig(
  event: SocketIoEventName,
  handler: SocketIoMessageHandler
): SocketIoRequestConfig;
export function createSocketIoMessageRequestConfig(
  config: SocketIoMessageHandlerObject
): SocketIoRequestConfig;
export function createSocketIoMessageRequestConfig(
  eventOrConfig: SocketIoEventName | SocketIoMessageHandlerObject,
  handler?: SocketIoMessageHandler
): SocketIoRequestConfig {
  const route =
    typeof eventOrConfig === 'string'
      ? createMessageRouteConfig(eventOrConfig, handler!)
      : createMessageRouteConfig(eventOrConfig.event, eventOrConfig.handler);

  return {
    transportType: 'socket.io',
    type: 'message',
    routes: [route]
  };
}

export function createSocketIoConnectionRequestConfig(
  handler: SocketIoConnectionHandler
): SocketIoRequestConfig;
export function createSocketIoConnectionRequestConfig(
  config: SocketIoConnectionHandlerObject
): SocketIoRequestConfig;
export function createSocketIoConnectionRequestConfig(
  config: SocketIoConnectionHandler | SocketIoConnectionHandlerObject
): SocketIoRequestConfig {
  return {
    transportType: 'socket.io',
    type: 'connection',
    routes: [createConnectionRouteConfig(config)]
  };
}

export const socketio = {
  connection: createSocketIoConnectionRequestConfig,
  message: createSocketIoMessageRequestConfig
};
