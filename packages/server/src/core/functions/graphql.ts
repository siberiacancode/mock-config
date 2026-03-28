import type {
  GraphQLEntitiesByEntityName,
  GraphQLOperationName,
  GraphQLOperationType,
  GraphQLParams,
  GraphQLRequestConfig,
  GraphQLRouteConfig,
  GraphQLSettings
} from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

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
  if (typeof config === 'function') return 'handler';
  if (!isPlainObject(config)) return 'inlineResponse';
  if ('queue' in config) return 'queue';
  if ('response' in config) return 'data';
  if ('handler' in config) return 'handler';
  return 'inlineResponse';
};

const createConfigResolver = <Options extends GraphQLRequestInput>(
  config: GraphQLConfig<Options>,
  settings?: GraphQLSettings
) => {
  const type = resolveConfigType(config);

  switch (type) {
    case 'inlineResponse':
      return {
        data: config as Options['response'],
        entities: {},
        settings: {
          polling: false,
          ...settings
        }
      };

    case 'data': {
      const dataConfig = config as GraphQLResponseObject<Options['response']>;

      return {
        data: dataConfig.response,
        entities: dataConfig.match ?? {},
        settings: {
          polling: false,
          ...settings
        }
      };
    }

    case 'queue': {
      const queueConfig = config as GraphQLQueueObject<Options>;

      return {
        queue: queueConfig.queue.map((item) => {
          if ('handler' in item) {
            return {
              data: item.handler,
              ...(typeof item.time === 'number' ? { time: item.time } : {})
            };
          }

          return {
            data: item.response,
            ...(typeof item.time === 'number' ? { time: item.time } : {})
          };
        }),
        entities: queueConfig.match ?? {},
        settings: {
          polling: true,
          ...settings
        }
      };
    }

    case 'handler': {
      if (typeof config === 'function') {
        return {
          data: config,
          entities: {},
          settings: {
            polling: false,
            ...settings
          }
        };
      }

      const handlerConfig = config as GraphQLHandlerObject<Options>;

      return {
        data: handlerConfig.handler,
        entities: handlerConfig.match ?? {},
        settings: {
          polling: false,
          ...settings
        }
      };
    }

    default:
      throw new Error(`Unexpected route config kind: ${type}`);
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
  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Response = Request['response']
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLResponseObject<Response>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Options extends GraphQLRequestInput = Request
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLHandlerObject<Options>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Options extends GraphQLRequestInput = Request
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLFunction<Options>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Options extends GraphQLRequestInput = Request
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLQueueObject<Options>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Options extends GraphQLRequestInput = Request
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: InlineResponse<Options['response']>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Options extends GraphQLRequestInput = Request
  >(
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
