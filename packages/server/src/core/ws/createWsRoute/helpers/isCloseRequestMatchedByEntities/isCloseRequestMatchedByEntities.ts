import type { CloseWsRequestArtifact, Entries, WsCloseParams } from '@/utils/types';

import { isComparator, resolveEntityValues } from '@/utils/helpers';

import { equals } from '../../../../entities';

export const isCloseRequestMatchedByEntities = (
  close: Pick<WsCloseParams, 'code' | 'reason'>,
  entities: CloseWsRequestArtifact['config']['entities']
) => {
  if (!entities) return true;

  const entityEntries = Object.entries(entities) as Entries<Required<typeof entities>>;

  return entityEntries.every(([entityName, valueOrComparator]) => {
    const actualEntity = close[entityName];

    const comparator = isComparator(valueOrComparator)
      ? valueOrComparator
      : equals(valueOrComparator);

    return resolveEntityValues({ actual: actualEntity, comparator });
  });
};
