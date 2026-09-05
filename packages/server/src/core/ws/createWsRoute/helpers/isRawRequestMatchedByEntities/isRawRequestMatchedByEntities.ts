import { Buffer } from 'node:buffer';

import type { Entries, RawWsRequestArtifact, WsFrame } from '@/utils/types';

import { isComparator, resolveEntityValues } from '@/utils/helpers';

import { equals } from '../../../../entities';

export const isRawRequestMatchedByEntities = (
  frame: WsFrame,
  entities: RawWsRequestArtifact['config']['entities']
) => {
  if (!entities) return true;

  const entityEntries = Object.entries(entities) as Entries<Required<typeof entities>>;

  return entityEntries.every(([entityName, valueOrComparator]) => {
    if (entityName === 'isBinary') {
      const comparator = isComparator(valueOrComparator)
        ? valueOrComparator
        : equals(valueOrComparator);

      return resolveEntityValues({ actual: frame.isBinary, comparator });
    }

    if (Buffer.isBuffer(valueOrComparator)) {
      return Buffer.isBuffer(frame.raw) && frame.raw.equals(valueOrComparator);
    }

    const actualData =
      typeof valueOrComparator === 'string' ? frame.raw.toString('utf-8') : frame.data;

    const comparator = isComparator(valueOrComparator)
      ? valueOrComparator
      : equals(valueOrComparator);

    return resolveEntityValues({ actual: actualData, comparator });
  });
};
