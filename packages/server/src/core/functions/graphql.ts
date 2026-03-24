import type { Request } from 'express';

import type {
  Data,
  GraphQLEntitiesByEntityName,
  GraphQLOperationName,
  GraphQLOperationType,
  GraphQLParams,
  GraphQLRequestConfig,
  GraphQLSettings
} from '@/utils/types';

type GraphqlFunction = (request: Request, params: GraphQLParams) => Data | Promise<Data>;

interface GraphqlDataObject {
  data: Data;
  match?: GraphQLEntitiesByEntityName;
}

interface GraphqlHandlerObject {
  handler: GraphqlFunction;
  match?: GraphQLEntitiesByEntityName;
}

interface GraphqlQueueObject {
  match?: GraphQLEntitiesByEntityName;
  queue: ((GraphqlDataObject & { time?: number }) | (GraphqlHandlerObject & { time?: number }))[];
}

type GraphqlConfig =
  | Data
  | GraphqlDataObject
  | GraphqlFunction
  | GraphqlHandlerObject
  | GraphqlQueueObject;

const createConfigResolver = (config: GraphqlConfig, settings?: GraphQLSettings) => {
  if (typeof config === 'function')
    return {
      data: config,
      entities: {},
      settings: {
        polling: false,
        ...settings
      }
    };

  const isConfig =
    typeof config === 'object' &&
    config !== null &&
    ('data' in config || 'queue' in config || 'match' in config);
  if (!isConfig)
    return {
      data: config,
      entities: {},
      settings
    };

  if ('data' in config)
    return {
      data: config.data,
      entities: config.match,
      settings
    };

  if ('queue' in config)
    return {
      queue: config.queue.map((item: any) =>
        'handler' in item
          ? {
              data: item.handler,
              ...(typeof item.time === 'number' ? { time: item.time } : {})
            }
          : item
      ),
      entities: config.match,
      settings: {
        polling: true,
        ...settings
      }
    };

  if ('handler' in config)
    return {
      data: config.handler,
      entities: config.match,
      settings
    };

  throw new Error('Invalid config');
};

const createRouteConfig = (config: GraphqlConfig, settings?: GraphQLSettings) =>
  createConfigResolver(config, settings);

const createGraphqlFactory =
  (operationType: 'raw' | GraphQLOperationType) =>
  (
    operationName: string | GraphQLOperationName,
    config: GraphqlConfig,
    settings?: GraphQLSettings
  ) =>
    ({
      ...(operationType === 'raw' && { query: operationName }),
      ...(operationType !== 'raw' && { operationName }),
      operationType,
      routes: [createRouteConfig(config, settings)]
    }) as GraphQLRequestConfig;

export const graphql = {
  mutation: createGraphqlFactory('mutation'),
  query: createGraphqlFactory('query'),
  raw: createGraphqlFactory('raw')
};
