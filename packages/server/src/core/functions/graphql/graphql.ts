import type {
  GraphQLEntitiesByEntityName,
  GraphQLExecutionResult,
  GraphQLIdentifier,
  GraphQLOperationType,
  GraphQLParams,
  GraphQLRequestConfig,
  GraphQLRouteConfig,
  GraphQLSettings,
  GraphqlTransportWsEntitiesByEntityName,
  GraphqlTransportWsExecutionResult,
  GraphqlTransportWsParams,
  GraphqlTransportWsRequestConfig,
  GraphqlTransportWsRouteConfig,
  MaybePromise
} from '@/utils/types';

import { createQueueHandler } from './helpers';

interface GraphQLRequestInput {
  body?: unknown;
  params?: unknown;
  query?: unknown;
  response: GraphQLExecutionResult;
}

type ReservedGraphQLConfigKeys = {
  [K in 'handler' | 'match' | 'queue' | 'response']?: never;
};

type GraphQLInlineResponse<Response extends GraphQLExecutionResult> = Response &
  ReservedGraphQLConfigKeys;

type GraphQLFunction<Options extends GraphQLRequestInput> = (
  params: GraphQLParams<Options['query'], Options['body'], Options['params'], Options['response']>
) => MaybePromise<Options['response']>;

interface GraphQLResponseObject<Response extends GraphQLExecutionResult> {
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
    case 'inlineHandler':
    case 'inlineResponse':
      return {
        data: resolvedConfig.config,
        entities: {},
        settings
      };

    case 'data': {
      return {
        data: resolvedConfig.config.response!,
        entities: resolvedConfig.config.match ?? {},
        settings
      };
    }

    case 'queue': {
      const normalizedQueue = resolvedConfig.config.queue!.map((item) => {
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

    case 'handler': {
      return {
        data: resolvedConfig.config.handler!,
        entities: resolvedConfig.config.match ?? {},
        settings
      };
    }

    default: {
      throw new Error(`Unexpected route config kind: ${JSON.stringify(config, null, 2)}`);
    }
  }
};

const createGraphQLFactory = <OperationType extends GraphQLOperationType>(
  operationType: OperationType
) => {
  function createRequestConfig<Options extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLResponseObject<Options['response']>,
    settings?: GraphQLSettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLHandlerObject<Options>,
    settings?: GraphQLSettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLFunction<Options>,
    settings?: GraphQLSettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLQueueObject<Options>,
    settings?: GraphQLSettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLInlineResponse<Options['response']>,
    settings?: GraphQLSettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLConfig<Options>,
    settings?: GraphQLSettings
  ): GraphQLRequestConfig {
    return {
      identifier,
      operationType,
      routes: [createConfigResolver(config, settings)]
    };
  }

  return createRequestConfig;
};

interface GraphqlTransportWsRequestInput {
  response: GraphqlTransportWsExecutionResult;
}

type ReservedGraphqlTransportWsConfigKeys = {
  [K in 'handler' | 'match' | 'response']?: never;
};

type GraphqlTransportWsInlineResponse<Response extends GraphqlTransportWsExecutionResult> =
  Response & ReservedGraphqlTransportWsConfigKeys;

type GraphqlTransportWsFunction<Options extends GraphqlTransportWsRequestInput> = (
  params: GraphqlTransportWsParams
) => MaybePromise<Options['response']>;

interface GraphqlTransportWsResponseObject<Response extends GraphqlTransportWsExecutionResult> {
  match?: GraphqlTransportWsEntitiesByEntityName;
  response: Response;
}

interface GraphqlTransportWsHandlerObject<Options extends GraphqlTransportWsRequestInput> {
  handler: GraphqlTransportWsFunction<Options>;
  match?: GraphqlTransportWsEntitiesByEntityName;
}

type GraphqlTransportWsConfig<Options extends GraphqlTransportWsRequestInput> =
  | GraphqlTransportWsFunction<Options>
  | GraphqlTransportWsHandlerObject<Options>
  | GraphqlTransportWsInlineResponse<Options['response']>
  | GraphqlTransportWsResponseObject<Options['response']>;

const resolveSubscriptionConfigType = <Options extends GraphqlTransportWsRequestInput>(
  config: GraphqlTransportWsConfig<Options>
) => {
  if (typeof config === 'function') return { type: 'inlineHandler' as const, config };
  if (typeof config !== 'object' || config === null)
    return { type: 'inlineResponse' as const, config };
  if ('response' in config) return { type: 'data' as const, config };
  if ('handler' in config) return { type: 'handler' as const, config };
  return { type: 'inlineResponse' as const, config };
};

const createSubscriptionRouteConfig = <Options extends GraphqlTransportWsRequestInput>(
  config: GraphqlTransportWsConfig<Options>
): GraphqlTransportWsRouteConfig => {
  const resolvedConfig = resolveSubscriptionConfigType(config);

  switch (resolvedConfig.type) {
    case 'inlineHandler':
    case 'inlineResponse':
      return {
        data: resolvedConfig.config,
        entities: {}
      };

    case 'data':
      return {
        data: resolvedConfig.config.response!,
        entities: resolvedConfig.config.match ?? {}
      };

    case 'handler':
      return {
        data: resolvedConfig.config.handler!,
        entities: resolvedConfig.config.match ?? {}
      };

    default: {
      throw new Error(
        `Unexpected subscription route config kind: ${JSON.stringify(config, null, 2)}`
      );
    }
  }
};

const createGraphqlTransportWsFactory = () => {
  function createRequestConfig<
    Options extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsFunction<Options>
  ): GraphqlTransportWsRequestConfig;

  function createRequestConfig<
    Options extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsHandlerObject<Options>
  ): GraphqlTransportWsRequestConfig;

  function createRequestConfig<
    Options extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsInlineResponse<Options['response']>
  ): GraphqlTransportWsRequestConfig;

  function createRequestConfig<
    Options extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsResponseObject<Options['response']>
  ): GraphqlTransportWsRequestConfig;

  function createRequestConfig<
    Options extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsConfig<Options>
  ): GraphqlTransportWsRequestConfig {
    return {
      identifier,
      operationType: 'subscription',
      routes: [createSubscriptionRouteConfig(config)]
    };
  }

  return createRequestConfig;
};

export const graphql = {
  query: createGraphQLFactory('query'),
  mutation: createGraphQLFactory('mutation'),
  subscription: createGraphqlTransportWsFactory()
};

graphql.subscription('Users', () => ({ data: { ok: true } }));
