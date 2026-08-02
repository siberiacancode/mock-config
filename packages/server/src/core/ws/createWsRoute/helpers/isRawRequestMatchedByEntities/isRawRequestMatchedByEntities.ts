import { Buffer } from 'node:buffer';

import type { Entries, RawWsRequestArtifact, WsFrame } from '@/utils/types';

import { isComparator, resolveEntityValues } from '@/utils/helpers';

import { equals } from '../../../../entities';

const toText = (raw: WsFrame['raw']) => (typeof raw === 'string' ? raw : raw.toString('utf-8'));

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

    /**
     * Expected string is compared with the frame text as is, everything else is compared
     * with the decoded frame data, so both `data: 'ping'` for `ping` frame and
     * `data: { type: 'ping' }` for `{"type":"ping"}` frame are matched
     */
    const actualData = typeof valueOrComparator === 'string' ? toText(frame.raw) : frame.data;

    const comparator = isComparator(valueOrComparator)
      ? valueOrComparator
      : equals(valueOrComparator);

    return resolveEntityValues({ actual: actualData, comparator });
  });
};
