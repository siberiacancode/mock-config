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

type GraphQLFunction<Input extends GraphQLRequestInput> = (
  params: GraphQLParams<Input['query'], Input['body'], Input['params'], Input['response']>
) => MaybePromise<Input['response']>;

type GraphQLGeneratorFunction<Input extends GraphQLRequestInput> = (
  params: GraphQLParams<Input['query'], Input['body'], Input['params'], Input['response']>
) => Generator<
  Input['response'],
  Input['response'],
  GraphQLParams<Input['query'], Input['body'], Input['params'], Input['response']>
>;

type GraphQLPollingItem<Input extends GraphQLRequestInput> =
  | { handler: GraphQLFunction<Input>; time?: number }
  | { response: Input['response']; time?: number };

type GraphQLPolling<Input extends GraphQLRequestInput> = GraphQLPollingItem<Input>[];

interface GraphQLPollingObject<Input extends GraphQLRequestInput> {
  polling: GraphQLPolling<Input>;
}

type GraphQLConfig<Input extends GraphQLRequestInput> =
  | GraphQLFunction<Input>
  | GraphQLGeneratorFunction<Input>
  | GraphQLInlineResponse<Input['response']>
  | GraphQLPollingObject<Input>;

interface GraphqlTransportWsRequestInput {
  response: GraphqlTransportWsExecutionResult;
}

type GraphqlTransportWsFactorySettings = GraphqlTransportWsSettings & {
  match?: GraphqlTransportWsEntitiesByEntityName;
};

type GraphqlTransportWsInlineResponse<Response extends GraphqlTransportWsExecutionResult> =
  Response;

type GraphqlTransportWsFunction<Input extends GraphqlTransportWsRequestInput> = (
  params: GraphqlTransportWsParams
) => MaybePromise<Input['response']>;

type GraphqlTransportWsConfig<Input extends GraphqlTransportWsRequestInput> =
  | GraphqlTransportWsFunction<Input>
  | GraphqlTransportWsInlineResponse<Input['response']>;

const resolveConfigType = <Input extends GraphQLRequestInput>(config: GraphQLConfig<Input>) => {
  if (typeof config === 'function' && isGeneratorFunction(config))
    return { type: 'generator' as const, config };
  if (typeof config === 'function') return { type: 'handler' as const, config };
  if (typeof config !== 'object' || config === null) return { type: 'data' as const, config };
  if ('polling' in config) return { type: 'polling' as const, config };
  return { type: 'data' as const, config };
};

const createConfigResolver = <Input extends GraphQLRequestInput>(
  config: GraphQLConfig<Input>,
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
      const config = resolvedConfig.config as GraphQLGeneratorFunction<Input>;
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
  function createRequestConfig<Input extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLPollingObject<Input>,
    settings?: GraphQLFactorySettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Input extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLFunction<Input> | GraphQLGeneratorFunction<Input>,
    settings?: GraphQLFactorySettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Input extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLInlineResponse<Input['response']>,
    settings?: GraphQLFactorySettings
  ): GraphQLRequestConfig;

  function createRequestConfig<Input extends GraphQLRequestInput = GraphQLRequestInput>(
    identifier: GraphQLIdentifier,
    config: GraphQLConfig<Input>,
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

const resolveSubscriptionConfigType = <Input extends GraphqlTransportWsRequestInput>(
  config: GraphqlTransportWsConfig<Input>
) => {
  if (typeof config === 'function') return { type: 'handler' as const, config };
  return { type: 'data' as const, config };
};

const createSubscriptionRouteConfig = <Input extends GraphqlTransportWsRequestInput>(
  config: GraphqlTransportWsConfig<Input>,
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
    Input extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsFunction<Input>,
    settings?: GraphqlTransportWsFactorySettings
  ): GraphqlTransportWsRequestConfig;

  function createRequestConfig<
    Input extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsInlineResponse<Input['response']>,
    settings?: GraphqlTransportWsFactorySettings
  ): GraphqlTransportWsRequestConfig;

  function createRequestConfig<
    Input extends GraphqlTransportWsRequestInput = GraphqlTransportWsRequestInput
  >(
    identifier: GraphQLIdentifier,
    config: GraphqlTransportWsConfig<Input>,
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

const polling = <Input extends GraphQLRequestInput = GraphQLRequestInput>(
  value: GraphQLPollingObject<Input>['polling']
) => ({ polling: value });

export const graphql = {
  query: createGraphQLFactory('query'),
  mutation: createGraphQLFactory('mutation'),
  polling,
  subscription: createGraphqlTransportWsFactory()
};
