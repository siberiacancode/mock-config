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

type GraphQLFunction<Response, Query, Body, Params> = (
  params: GraphQLParams<Query, Body, Params, Response>
) => Promise<Response> | Response;

interface GraphQLResponseObject<Response> {
  match?: GraphQLEntitiesByEntityName;
  response: Response;
}

interface GraphQLHandlerObject<Response, Query, Body, Params> {
  handler: GraphQLFunction<Response, Query, Body, Params>;
  match?: GraphQLEntitiesByEntityName;
}

interface GraphQLQueueResponseItem<Response> {
  response: Response;
  time?: number;
}

interface GraphQLQueueHandlerItem<Response, Query, Body, Params> {
  handler: GraphQLFunction<Response, Query, Body, Params>;
  time?: number;
}

interface GraphQLQueueObject<Response, Query, Body, Params> {
  match?: GraphQLEntitiesByEntityName;
  queue: Array<
    GraphQLQueueHandlerItem<Response, Query, Body, Params> | GraphQLQueueResponseItem<Response>
  >;
}

type GraphQLObjectConfig<Response, Query, Body, Params> =
  | GraphQLHandlerObject<Response, Query, Body, Params>
  | GraphQLQueueObject<Response, Query, Body, Params>
  | GraphQLResponseObject<Response>;

type GraphQLConfig<Response, Query, Body, Params> =
  | GraphQLFunction<Response, Query, Body, Params>
  | GraphQLObjectConfig<Response, Query, Body, Params>
  | InlineResponse<Response>;

const resolveConfigType = <Response, Query, Body, Params>(
  config: GraphQLConfig<Response, Query, Body, Params>
) => {
  if (typeof config === 'function') return 'handler';
  if (!isPlainObject(config)) return 'inlineResponse';
  if ('queue' in config) return 'queue';
  if ('response' in config) return 'data';
  if ('handler' in config) return 'handler';
  return 'inlineResponse';
};

const createConfigResolver = <Response, Query, Body, Params>(
  config: GraphQLConfig<Response, Query, Body, Params>,
  settings?: GraphQLSettings
) => {
  const type = resolveConfigType(config);

  switch (type) {
    case 'inlineResponse':
      return {
        data: config as Response,
        entities: {},
        settings: {
          polling: false,
          ...settings
        }
      };

    case 'data': {
      const dataConfig = config as GraphQLResponseObject<Response>;

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
      const queueConfig = config as GraphQLQueueObject<Response, Query, Body, Params>;

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

      const handlerConfig = config as GraphQLHandlerObject<Response, Query, Body, Params>;

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
    Response = Request['response'],
    Query = Request['query'],
    Body = Request['body'],
    Params = Request['params']
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLHandlerObject<Response, Query, Body, Params>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Response = Request['response'],
    Query = Request['query'],
    Body = Request['body'],
    Params = Request['params']
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLFunction<Response, Query, Body, Params>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Response = Request['response'],
    Query = Request['query'],
    Body = Request['body'],
    Params = Request['params']
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLQueueObject<Response, Query, Body, Params>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Response = Request['response']
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: InlineResponse<Response>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig;

  function createRequestConfig<
    Request extends Partial<GraphQLRequestInput> = {},
    Response = Request['response'],
    Query = Request['query'],
    Body = Request['body'],
    Params = Request['params']
  >(
    identifier: GraphQLIdentifier<Mode>,
    config: GraphQLConfig<Response, Query, Body, Params>,
    settings?: GraphQLSettings,
    operationType?: GraphQLOperationTypeArg<Mode>
  ): GraphQLRequestConfig {
    if (mode === 'raw') {
      return {
        query: identifier as string,
        operationType: (operationType ?? 'query') as GraphQLOperationType,
        routes: [
          createConfigResolver(
            config as GraphQLConfig<Response, Query, Body, Params>,
            settings
          ) as GraphQLRouteConfig
        ]
      };
    }

    return {
      operationName: identifier as GraphQLOperationName,
      operationType: mode,
      routes: [
        createConfigResolver(
          config as GraphQLConfig<Response, Query, Body, Params>,
          settings
        ) as GraphQLRouteConfig
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
