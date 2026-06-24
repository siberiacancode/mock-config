import type { Express } from 'express';

import type { ConnectionWsRequestArtifact, Entries } from '@/utils/types';

import { isComparator, resolveEntityValues } from '@/utils/helpers';

import { equals } from '../../../../entities';

type WsRequest = Express['request'] & {
  queries: Record<string, string | string[]>;
  cookies: Record<string, string>;
};

export const isRequestMatchedByEntities = (
  request: WsRequest,
  entities: ConnectionWsRequestArtifact['config']['entities']
) => {
  if (!entities) return true;

  const entityEntries = Object.entries(entities) as Entries<Required<typeof entities>>;

  return entityEntries.every(([entityName, valueOrComparator]) => {
    const actualEntity = request[entityName];

    if (isComparator(valueOrComparator)) {
      return resolveEntityValues({ actual: actualEntity, comparator: valueOrComparator });
    }

    const mappedEntityEntries = Object.entries(valueOrComparator);
    return mappedEntityEntries.every(([entityPropertyKey, propertyValueOrComparator]) => {
      const actualPropertyKey =
        entityName === 'headers' ? entityPropertyKey.toLowerCase() : entityPropertyKey;
      const actualPropertyValue = actualEntity[actualPropertyKey];

      const comparator = isComparator(propertyValueOrComparator)
        ? propertyValueOrComparator
        : equals(propertyValueOrComparator);

      return resolveEntityValues({ actual: actualPropertyValue, comparator });
    });
  });
};
