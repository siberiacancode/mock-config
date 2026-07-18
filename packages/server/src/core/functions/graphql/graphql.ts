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
  GraphqlTransportWsSettings,
  MaybePromise
} from '@/utils/types';

import { isGeneratorFunction } from '@/utils/helpers';

import { createGenerator } from '../shared/helpers';
import { createPollingHandler } from './helpers';

interface GraphQLRequestInput {
  body?: unknown;
  params?: unknown;
  query?: unknown;
  response: GraphQLExecutionResult;
}

type GraphQLFactorySettings = GraphQLSettings & {
  match?: GraphQLEntitiesByEntityName;
};

type ReservedGraphQLConfigKeys = {
  [K in 'polling']?: never;
};

type GraphQLInlineResponse<Response extends GraphQLExecutionResult> = Response &
  ReservedGraphQLConfigKeys;

type GraphQLFunction<Options extends GraphQLRequestInput> = (
  params: GraphQLParams<Options['query'], Options['body'], Options['params'], Options['response']>
) => MaybePromise<Options['response']>;

type GraphQLGeneratorFunction<Options extends GraphQLRequestInput> = (
  params: GraphQLParams<Options['query'], Options['body'], Options['params'], Options['response']>
) => Generator<
  Options['response'],
  Options['response'] | void,
  GraphQLParams<Options['query'], Options['body'], Options['params'], Options['response']>
>;

type GraphQLPollingItem<Options extends GraphQLRequestInput> =
  | { handler: GraphQLFunction<Options>; time?: number }
  | { response: Options['response']; time?: number };

type GraphQLPolling<Options extends GraphQLRequestInput> = GraphQLPollingItem<Options>[];

interface GraphQLPollingObject<Options extends GraphQLRequestInput> {
  polling: GraphQLPolling<Options>;
}

type GraphQLConfig<Options extends GraphQLRequestInput> =
  | GraphQLFunction<Options>
  | GraphQLGeneratorFunction<Options>
  | GraphQLInlineResponse<Options['response']>
  | GraphQLPollingObject<Options>;

const resolveConfigType = <Options extends GraphQLRequestInput>(config: GraphQLConfig<Options>) => {
  if (typeof config === 'function' && isGeneratorFunction(config))
    return { type: 'generator' as const, config };
  if (typeof config === 'function') return { type: 'handler' as const, config };
  if (typeof config !== 'object' || config === null) return { type: 'data' as const, config };
  if ('polling' in config) return { type: 'polling' as const, config };
  return { type: 'data' as const, config };
};

const createConfigResolver = <Options extends GraphQLRequestInput>(
  config: GraphQLConfig<Options>,
  factorySettings: GraphQLFactorySettings = {}
): GraphQLRouteConfig => {
  const resolvedConfig = resolveConfigType(config);
  const { match: entities = {}, ...settings } = factorySettings;

  switch (resolvedConfig.type) {
    case 'data': {
      return {
        data: resolvedConfig.config,
        entities,
        settings
      };
    }

    case 'polling': {
      const polling = resolvedConfig.config.polling!;
      const normalizedPolling = polling.map((item) => {
        if ('handler' in item) {
          return {
            data: item.handler,
            time: item.time
          };
        }

        if ('response' in item) {
          return { data: item.response, time: item.time };
        }

        throw new Error(`Unexpected polling item kind: ${JSON.stringify(item, null, 2)}`);
      });

      return {
        data: createPollingHandler(normalizedPolling),
        entities,
        settings
      };
    }

    case 'generator': {
      const config = resolvedConfig.config as GraphQLGeneratorFunction<Options>;
      const generator = createGenerator(config);
      return { data: generator, entities, settings };
    }

    case 'handler': {
      return {
        data: resolvedConfig.config,
        entities,
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
    config: GraphQLPollingObject<Options>,
    settings?: GraphQLFactorySettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLFunction<Options> | GraphQLGeneratorFunction<Options>,
    settings?: GraphQLFactorySettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLInlineResponse<Options['response']>,
    settings?: GraphQLFactorySettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Options extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLConfig<Options>,
    settings?: GraphQLFactorySettings
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

type GraphqlTransportWsFactorySettings = GraphqlTransportWsSettings & {
  match?: GraphqlTransportWsEntitiesByEntityName;
};

type GraphqlTransportWsInlineResponse<Response extends GraphqlTransportWsExecutionResult> =
  Response;

type GraphqlTransportWsFunction<Options extends GraphqlTransportWsRequestInput> = (
  params: GraphqlTransportWsParams
) => MaybePromise<Options['response']>;

type GraphqlTransportWsConfig<Options extends GraphqlTransportWsRequestInput> =
  | GraphqlTransportWsFunction<Options>
  | GraphqlTransportWsInlineResponse<Options['response']>;

const resolveSubscriptionConfigType = <Options extends GraphqlTransportWsRequestInput>(
  config: GraphqlTransportWsConfig<Options>
) => {
  if (typeof config === 'function') return { type: 'handler' as const, config };
  if (typeof config !== 'object' || config === null) return { type: 'data' as const, config };
  return { type: 'data' as const, config };
};

const createSubscriptionRouteConfig = <Options extends GraphqlTransportWsRequestInput>(
  config: GraphqlTransportWsConfig<Options>,
  settings: GraphqlTransportWsFactorySettings = {}
): GraphqlTransportWsRouteConfig => {
  const resolvedConfig = resolveSubscriptionConfigType(config);
  const { match: entities = {}, ...routeSettings } = settings;

  switch (resolvedConfig.type) {
    case 'data':
      return {
        data: resolvedConfig.config,
        entities,
        settings: routeSettings
      };

    case 'handler':
      return {
        data: resolvedConfig.config,
        entities,
        settings: routeSettings
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
    config: GraphqlTransportWsFunction<Options>,
    settings?: GraphqlTransportWsFactorySettings
  ): GraphqlTransportWsRequestConfig;

  function createRequestConfig<
    Options extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsInlineResponse<Options['response']>,
    settings?: GraphqlTransportWsFactorySettings
  ): GraphqlTransportWsRequestConfig;

  function createRequestConfig<
    Options extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsConfig<Options>,
    settings?: GraphqlTransportWsFactorySettings
  ): GraphqlTransportWsRequestConfig {
    return {
      identifier,
      operationType: 'subscription',
      routes: [createSubscriptionRouteConfig(config, settings)]
    };
  }

  return createRequestConfig;
};

export const graphql = {
  query: createGraphQLFactory('query'),
  mutation: createGraphQLFactory('mutation'),
  subscription: createGraphqlTransportWsFactory()
};

export const polling = <Options extends GraphQLRequestInput = GraphQLRequestInput>(
  value: GraphQLPollingObject<Options>['polling']
) => ({ polling: value });
