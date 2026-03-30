import type {
  WsEntitiesByEntityName,
  WsParams,
  WsRequestConfig,
  WsRouteConfig
} from '@/utils/types';

interface WsRequestInput {
  data?: unknown;
}

type WsFunction<Options extends WsRequestInput> = (
  params: WsParams<Options['data']>
) => Options['data'] | Promise<Options['data']>;

interface WsResponseObject<Response> {
  match?: WsEntitiesByEntityName;
  response: Response;
}

interface WsHandlerObject<Options extends WsRequestInput> {
  handler: WsFunction<Options>;
  match?: WsEntitiesByEntityName;
}

type WsInlineResponse<Response> = Response;

type WsConfig<Options extends WsRequestInput> =
  | WsFunction<Options>
  | WsHandlerObject<Options>
  | WsInlineResponse<Options['data']>
  | WsResponseObject<Options['data']>;

const resolveConfigType = <Options extends WsRequestInput>(config: WsConfig<Options>) => {
  if (typeof config === 'function') return { type: 'inlineHandler' as const, config };
  if (typeof config !== 'object' || config === null)
    return { type: 'inlineResponse' as const, config };
  if ('response' in config) return { type: 'data' as const, config };
  if ('handler' in config) return { type: 'handler' as const, config };
  return { type: 'inlineResponse' as const, config };
};

const createConfigResolver = <Options extends WsRequestInput>(
  config: WsConfig<Options>
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

function createEventConfig<Options extends WsRequestInput = Partial<WsRequestInput>>(
  event: WsRequestConfig['event'],
  config: WsResponseObject<Options['data']>
): WsRequestConfig;

function createEventConfig<Options extends WsRequestInput = Partial<WsRequestInput>>(
  event: WsRequestConfig['event'],
  config: WsHandlerObject<Options>
): WsRequestConfig;

function createEventConfig<Options extends WsRequestInput = Partial<WsRequestInput>>(
  event: WsRequestConfig['event'],
  config: WsFunction<Options>
): WsRequestConfig;

function createEventConfig<Options extends WsRequestInput = Partial<WsRequestInput>>(
  event: WsRequestConfig['event'],
  config: WsInlineResponse<Options['data']>
): WsRequestConfig;

function createEventConfig<Options extends WsRequestInput = Partial<WsRequestInput>>(
  event: WsRequestConfig['event'],
  config: WsConfig<Options>
): WsRequestConfig {
  return {
    event,
    routes: [createConfigResolver(config)]
  };
}

export const ws = {
  event: createEventConfig
};
