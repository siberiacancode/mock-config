import type {
  GraphQLEntitiesByEntityName,
  GraphQLOperationName,
  GraphQLOperationType,
  GraphQLParams,
  GraphQLRequestConfig,
  GraphQLRouteConfig,
  GraphQLSettings
} from '@/utils/types';

interface GraphQLRequestInput {
  body?: unknown;
  params?: unknown;
  query?: unknown;
  response?: unknown;
}

type ReservedGraphQLConfigKeys = {
  [K in 'handler' | 'match' | 'queue' | 'response']?: never;
};

type InlineResponse<Response> =
  Response extends Record<string, unknown> ? Response & ReservedGraphQLConfigKeys : Response;

type GraphQLFunction<Options extends GraphQLRequestInput> = (
  params: GraphQLParams<Options['query'], Options['body'], Options['params'], Options['response']>
) => Options['response'] | Promise<Options['response']>;

interface GraphQLResponseObject<Response> {
  match?: GraphQLEntitiesByEntityName;
  response: Response;
}

interface GraphQLHandlerObject<Options extends GraphQLRequestInput> {
  handler: GraphQLFunction<Options>;
  match?: GraphQLEntitiesByEntityName;
}

interface GraphQLQueueObject<Options extends GraphQLRequestInput> {
  match?: GraphQLEntitiesByEntityName;
  queue: Array<
    | { handler: GraphQLFunction<Options>; time?: number }
    | { response: Options['response']; time?: number }
  >;
}

type GraphQLConfig<Options extends GraphQLRequestInput> =
  | GraphQLFunction<Options>
  | GraphQLHandlerObject<Options>
  | GraphQLQueueObject<Options>
  | GraphQLResponseObject<Options['response']>
  | InlineResponse<Options['response']>;

const resolveConfigType = <Options extends GraphQLRequestInput>(config: GraphQLConfig<Options>) => {
  if (typeof config === 'function') return { type: 'inlineHandler' as const, config };
  if (typeof config !== 'object' || config === null)
    return { type: 'inlineResponse' as const, config };
  if ('queue' in config) return { type: 'queue' as const, config };
  if ('response' in config) return { type: 'data' as const, config };
  if ('handler' in config) return { type: 'handlerObj' as const, config };
  return { type: 'inlineResponse' as const, config };
};

const createConfigResolver = <Options extends GraphQLRequestInput>(
  config: GraphQLConfig<Options>,
  settings?: GraphQLSettings
) => {
  const resolvedConfig = resolveConfigType(config);

  switch (resolvedConfig.type) {
    case 'inlineResponse':
      return {
        data: resolvedConfig.config,
        entities: {},
        settings: { ...settings, polling: false }
      };

    case 'data': {
      return {
        data: resolvedConfig.config.response,
        entities: resolvedConfig.config.match ?? {},
        settings: { ...settings, polling: false }
      };
    }

    case 'queue': {
      return {
        queue: resolvedConfig.config.queue.map((item) => {
          if ('handler' in item) {
            return { data: item.handler, time: item.time };
          }

          return { data: item.response, time: item.time };
        }),
        entities: resolvedConfig.config.match ?? {},
        settings: { ...settings, polling: true }
      };
    }

    case 'inlineHandler':
      return {
        data: resolvedConfig.config,
        entities: {},
        settings: { ...settings, polling: false }
      };

    case 'handlerObj': {
      return {
        data: resolvedConfig.config.handler,
        entities: resolvedConfig.config.match ?? {},
        settings: { ...settings, polling: false }
      };
    }

    default: {
      throw new Error(`Unexpected route config kind: ${JSON.stringify(config, null, 2)}`);
    }
  }
};

type GraphQLFactoryMode = 'raw' | GraphQLOperationType;
type GraphQLIdentifier<Mode extends GraphQLFactoryMode> = Mode extends 'raw'
  ? string
  : GraphQLOperationName;
type GraphQLOperationTypeArg<Mode extends GraphQLFactoryMode> = Mode extends 'raw'
  ? GraphQLOperationType
  : never;

const createGraphQLFactory = <Mode extends GraphQLFactoryMode>(mode: Mode) => {
  function createRequestConfig<Options extends GraphQLRequestInput = Partial<GraphQLRequestInput>>(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLResponseObject<Options['response']>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = Partial<GraphQLRequestInput>>(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLHandlerObject<Options>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = Partial<GraphQLRequestInput>>(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLFunction<Options>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = Partial<GraphQLRequestInput>>(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLQueueObject<Options>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = Partial<GraphQLRequestInput>>(
    identifier: GraphQLIdentifier<Mode>,
    config: InlineResponse<Options['response']>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = Partial<GraphQLRequestInput>>(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLConfig<Options>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig {
    if (mode === 'raw') {
      return {
        query: identifier as string,
        operationType: (operationType ?? 'query') as GraphQLOperationType,
        routes: [
          createConfigResolver(config as GraphQLConfig<Options>, settings) as GraphQLRouteConfig
        ]
      };
    }

    return {
      operationName: identifier as GraphQLOperationName,
      operationType: mode,
      routes: [
        createConfigResolver(config as GraphQLConfig<Options>, settings) as GraphQLRouteConfig
      ]
    };
  }

  return createRequestConfig;
};

export const graphql = {
  query: createGraphQLFactory('query'),
  mutation: createGraphQLFactory('mutation'),
  raw: createGraphQLFactory('raw')
};
