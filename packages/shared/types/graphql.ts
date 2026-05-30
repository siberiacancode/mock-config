import type { Request } from 'express';

import type { MappedEntity, VariablesPlainEntity } from './entities';
import type { Interceptors } from './interceptors';
import type { MaybePromise } from './utils';
import type { Data } from './values';

export type GraphQLEntityName = 'cookies' | 'headers' | 'query' | 'variables';

export type GraphQLEntity<EntityName extends GraphQLEntityName = GraphQLEntityName> =
  EntityName extends 'variables' ? VariablesPlainEntity : MappedEntity;

export type GraphQLOperationType = 'mutation' | 'query';
export type GraphQLIdentifier = string | RegExp;

export type GraphQLEntitiesByEntityName = {
  [EntityName in GraphQLEntityName]?: GraphQLEntity<EntityName>;
};

interface GraphQLSettings {
  readonly delay?: number;
  readonly polling?: boolean;
  readonly status?: number;
}

export type GraphqlDataResponse =
  | ((request: Request, entities: GraphQLEntitiesByEntityName) => MaybePromise<Data>)
  | Data;

export type GraphQLRouteConfig = (
  | {
      settings: GraphQLSettings & { polling: true };
      queue: Array<{
        time?: number;
        data: GraphqlDataResponse;
      }>;
    }
  | {
      settings?: GraphQLSettings & { polling?: false };
      data: GraphqlDataResponse;
    }
) & { entities?: GraphQLEntitiesByEntityName; interceptors?: Interceptors<'graphql'> };

export interface GraphQLRequestConfig {
  identifier: GraphQLIdentifier;
  interceptors?: Interceptors<'graphql'>;
  operationType: GraphQLOperationType;
  routes: GraphQLRouteConfig[];
}
