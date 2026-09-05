import type { Entries, ErrorWsRequestArtifact, WsErrorParams } from '@/utils/types';

import { isComparator, resolveEntityValues } from '@/utils/helpers';

import { equals } from '../../../../entities';

export const isErrorRequestMatchedByEntities = (
  error: WsErrorParams['error'],
  entities: ErrorWsRequestArtifact['config']['entities']
) => {
  if (!entities) return true;

  const entityEntries = Object.entries(entities) as Entries<Required<typeof entities>>;

  return entityEntries.every(([entityName, valueOrComparator]) => {
    const actualEntity = error[entityName];

    const comparator = isComparator(valueOrComparator)
      ? valueOrComparator
      : equals(valueOrComparator);

    return resolveEntityValues({ actual: actualEntity, comparator });
  });
};
