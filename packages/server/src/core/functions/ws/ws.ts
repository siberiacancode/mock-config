import type {
  WsEntitiesByEntityName,
  WsParams,
  WsRequestConfig,
  WsRouteConfig
} from '@/utils/types';

import { WS_MESSAGE_EVENT } from '@/utils/types';

interface WsRequestInput {
  meta?: unknown;
  payload?: unknown;
  response?: unknown;
}

type WsFunction<Options extends WsRequestInput> = (
  params: WsParams<Options['payload'], Options['meta']>
) => Options['response'] | Promise<Options['response']>;

interface WsResponseObject<Response> {
  match?: WsEntitiesByEntityName;
  response: Response;
}

interface WsHandlerObject<Options extends WsRequestInput> {
  handler: WsFunction<Options>;
  match?: WsEntitiesByEntityName;
}

type WsInlineResponse<Response> = Response;

type WsEventConfig<Options extends WsRequestInput> =
  | WsFunction<Options>
  | WsHandlerObject<Options>
  | WsInlineResponse<Options['response']>
  | WsResponseObject<Options['response']>;

type WsMessageFunction = <Payload = unknown, Meta = Record<string, unknown>>(
  params: WsParams<Payload, Meta>
) => Promise<void> | void;

const resolveConfigType = <Options extends WsRequestInput>(config: WsEventConfig<Options>) => {
  if (typeof config === 'function') return { type: 'inlineHandler' as const, config };
  if (typeof config !== 'object' || config === null)
    return { type: 'inlineResponse' as const, config };
  if ('response' in config) return { type: 'data' as const, config };
  if ('handler' in config) return { type: 'handler' as const, config };
  return { type: 'inlineResponse' as const, config };
};

const createConfigResolver = <Options extends WsRequestInput>(
  config: WsEventConfig<Options>
): WsRouteConfig => {
  const resolvedConfig = resolveConfigType(config);

  switch (resolvedConfig.type) {
    case 'inlineResponse':
      return {
        data: resolvedConfig.config as WsRouteConfig['data']
      };

    case 'data':
      return {
        data: resolvedConfig.config.response as WsRouteConfig['data'],
        entities: resolvedConfig.config.match
      };

    case 'inlineHandler':
      return {
        data: resolvedConfig.config as WsRouteConfig['data']
      };

    case 'handler':
      return {
        data: resolvedConfig.config.handler as WsRouteConfig['data'],
        entities: resolvedConfig.config.match
      };

    default: {
      throw new Error(`Unexpected ws route config kind: ${JSON.stringify(config, null, 2)}`);
    }
  }
};

function createWsEventRequestConfig<Options extends WsRequestInput = Partial<WsRequestInput>>(
  event: WsRequestConfig['event'],
  config: WsResponseObject<Options['response']>
): WsRequestConfig;
function createWsEventRequestConfig<Options extends WsRequestInput = Partial<WsRequestInput>>(
  event: WsRequestConfig['event'],
  config: WsHandlerObject<Options>
): WsRequestConfig;
function createWsEventRequestConfig<Options extends WsRequestInput = Partial<WsRequestInput>>(
  event: WsRequestConfig['event'],
  config: WsFunction<Options>
): WsRequestConfig;
function createWsEventRequestConfig<Options extends WsRequestInput = Partial<WsRequestInput>>(
  event: WsRequestConfig['event'],
  config: WsInlineResponse<Options['response']>
): WsRequestConfig;
function createWsEventRequestConfig(
  event: WsRequestConfig['event'],
  config: WsEventConfig<WsRequestInput>
): WsRequestConfig {
  return {
    event,
    routes: [createConfigResolver(config)]
  };
}

function createWsMessageRequestConfig(handler: WsMessageFunction): WsRequestConfig {
  return {
    event: WS_MESSAGE_EVENT,
    routes: [
      {
        data: handler
      }
    ]
  };
}

export const ws = {
  event: createWsEventRequestConfig,
  message: createWsMessageRequestConfig
};
