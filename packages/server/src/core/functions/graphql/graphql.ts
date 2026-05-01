import type {
  Data,
  GraphQLEntitiesByEntityName,
  GraphQLOperationName,
  GraphQLOperationType,
  GraphQLParams,
  GraphQLRequestConfig,
  GraphQLRouteConfig,
  GraphQLSettings,
  GraphQLWsProtocolEntitiesByEntityName,
  GraphQLWsProtocolParams,
  GraphQLWsProtocolRequestConfig,
  GraphQLWsProtocolRouteConfig
} from '@/utils/types';

import { createQueueHandler } from './helpers';

interface GraphQLRequestInput {
  body?: unknown;
  params?: unknown;
  query?: unknown;
  response?: Data;
}

type ReservedGraphQLConfigKeys = {
  [K in 'handler' | 'match' | 'queue' | 'response']?: never;
};

type GraphQLInlineResponse<Response> =
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
  | GraphQLInlineResponse<Options['response']>
  | GraphQLQueueObject<Options>
  | GraphQLResponseObject<Options['response']>;

const resolveConfigType = <Options extends GraphQLRequestInput>(config: GraphQLConfig<Options>) => {
  if (typeof config === 'function') return { type: 'inlineHandler' as const, config };
  if (typeof config !== 'object' || config === null)
    return { type: 'inlineResponse' as const, config };
  if ('queue' in config) return { type: 'queue' as const, config };
  if ('response' in config) return { type: 'data' as const, config };
  if ('handler' in config) return { type: 'handler' as const, config };
  return { type: 'inlineResponse' as const, config };
};

const createConfigResolver = <Options extends GraphQLRequestInput>(
  config: GraphQLConfig<Options>,
  settings: GraphQLSettings = {}
): GraphQLRouteConfig => {
  const resolvedConfig = resolveConfigType(config);

  switch (resolvedConfig.type) {
    case 'inlineResponse':
      return {
        data: resolvedConfig.config,
        entities: {},
        settings
      };

    case 'data': {
      return {
        data: resolvedConfig.config.response,
        entities: resolvedConfig.config.match ?? {},
        settings
      };
    }

    case 'queue': {
      const normalizedQueue = resolvedConfig.config.queue.map((item) => {
        if ('handler' in item) {
          return { data: item.handler, time: item.time };
        }

        if ('response' in item) {
          return { data: item.response, time: item.time };
        }

        throw new Error(`Unexpected queue item kind: ${JSON.stringify(item, null, 2)}`);
      });

      return {
        data: createQueueHandler(normalizedQueue),
        entities: resolvedConfig.config.match ?? {},
        settings
      };
    }

    case 'inlineHandler':
      return {
        data: resolvedConfig.config,
        entities: {},
        settings
      };

    case 'handler': {
      return {
        data: resolvedConfig.config.handler,
        entities: resolvedConfig.config.match ?? {},
        settings
      };
    }

    default: {
      throw new Error(`Unexpected route config kind: ${JSON.stringify(config, null, 2)}`);
    }
  }
};

type GraphQLFactoryMode = 'raw' | Exclude<GraphQLOperationType, 'subscription'>;
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
    config: GraphQLInlineResponse<Options['response']>,
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
        operationType: operationType ?? 'query',
        routes: [createConfigResolver(config, settings)]
      };
    }

    return {
      operationName: identifier,
      operationType: mode,
      routes: [createConfigResolver(config, settings)]
    };
  }

  return createRequestConfig;
};

interface GraphQLWsProtocolRequestInput {
  response?: Data;
}

type ReservedGraphQLWsProtocolConfigKeys = {
  [K in 'handler' | 'match']?: never;
};

type GraphQLWsProtocolInlineResponse<Response> =
  Response extends Record<string, unknown>
    ? Response & ReservedGraphQLWsProtocolConfigKeys
    : Response;

type GraphQLWsProtocolSugarFunction<Options extends GraphQLWsProtocolRequestInput> = (
  params: GraphQLWsProtocolParams
) => Options['response'] | Promise<Options['response']>;

interface GraphQLWsProtocolSugarResponseObject<Response> {
  match?: GraphQLWsProtocolEntitiesByEntityName;
  response: Response;
}

interface GraphQLWsProtocolSugarHandlerObject<Options extends GraphQLWsProtocolRequestInput> {
  handler: GraphQLWsProtocolSugarFunction<Options>;
  match?: GraphQLWsProtocolEntitiesByEntityName;
}

type GraphQLWsProtocolSugarConfig<Options extends GraphQLWsProtocolRequestInput> =
  | GraphQLWsProtocolInlineResponse<Options['response']>
  | GraphQLWsProtocolSugarFunction<Options>
  | GraphQLWsProtocolSugarHandlerObject<Options>
  | GraphQLWsProtocolSugarResponseObject<Options['response']>;

const resolveSubscriptionSugarConfigType = <Options extends GraphQLWsProtocolRequestInput>(
  config: GraphQLWsProtocolSugarConfig<Options>
) => {
  if (typeof config === 'function') return { type: 'inlineHandler' as const, config };
  if (typeof config !== 'object' || config === null)
    return { type: 'inlineResponse' as const, config };
  if ('response' in config) return { type: 'data' as const, config };
  if ('handler' in config) return { type: 'handler' as const, config };
  return { type: 'inlineResponse' as const, config };
};

const createSubscriptionRouteConfig = <Options extends GraphQLWsProtocolRequestInput>(
  config: GraphQLWsProtocolSugarConfig<Options>
): GraphQLWsProtocolRouteConfig => {
  const resolvedConfig = resolveSubscriptionSugarConfigType(config);

  switch (resolvedConfig.type) {
    case 'inlineResponse':
      return {
        data: resolvedConfig.config,
        entities: {}
      };

    case 'data':
      return {
        data: resolvedConfig.config.response,
        entities: resolvedConfig.config.match ?? {}
      };

    case 'inlineHandler':
      return {
        data: resolvedConfig.config,
        entities: {}
      };

    case 'handler':
      return {
        data: resolvedConfig.config.handler,
        entities: resolvedConfig.config.match ?? {}
      };

    default: {
      throw new Error(
        `Unexpected subscription route config kind: ${JSON.stringify(config, null, 2)}`
      );
    }
  }
};

const createGraphQLWsProtocolFactory = () => {
  function createRequestConfig<
    Options extends GraphQLWsProtocolRequestInput = Partial<GraphQLWsProtocolRequestInput>
  >(
    identifier: GraphQLOperationName,
    config: GraphQLWsProtocolSugarFunction<Options>
  ): GraphQLWsProtocolRequestConfig;

  function createRequestConfig<
    Options extends GraphQLWsProtocolRequestInput = Partial<GraphQLWsProtocolRequestInput>
  >(
    identifier: GraphQLOperationName,
    config: GraphQLWsProtocolSugarHandlerObject<Options>
  ): GraphQLWsProtocolRequestConfig;

  function createRequestConfig<
    Options extends GraphQLWsProtocolRequestInput = Partial<GraphQLWsProtocolRequestInput>
  >(
    identifier: GraphQLOperationName,
    config: GraphQLWsProtocolInlineResponse<Options['response']>
  ): GraphQLWsProtocolRequestConfig;

  function createRequestConfig<
    Options extends GraphQLWsProtocolRequestInput = Partial<GraphQLWsProtocolRequestInput>
  >(
    identifier: GraphQLOperationName,
    config: GraphQLWsProtocolSugarResponseObject<Options['response']>
  ): GraphQLWsProtocolRequestConfig;

  function createRequestConfig<
    Options extends GraphQLWsProtocolRequestInput = Partial<GraphQLWsProtocolRequestInput>
  >(
    identifier: GraphQLOperationName,
    config: GraphQLWsProtocolSugarConfig<Options>
  ): GraphQLWsProtocolRequestConfig {
    return {
      operationName: identifier,
      operationType: 'subscription',
      routes: [createSubscriptionRouteConfig(config)]
    };
  }

  return createRequestConfig;
};

export const graphql = {
  query: createGraphQLFactory('query'),
  mutation: createGraphQLFactory('mutation'),
  raw: createGraphQLFactory('raw'),
  subscription: createGraphQLWsProtocolFactory()
};
