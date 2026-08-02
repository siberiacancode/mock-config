import { Buffer } from 'node:buffer';

import type { Entries, RawWsRequestArtifact, WsFrame } from '@/utils/types';

import { isComparator, resolveEntityValues } from '@/utils/helpers';

import { equals } from '../../../../entities';

const toText = (raw: WsFrame['raw']) => (typeof raw === 'string' ? raw : raw.toString('utf-8'));

/**
 * Expected string is compared with the frame text as is, everything else is compared
 * with the parsed json, so both `data: 'ping'` for `ping` frame and
 * `data: { type: 'ping' }` for `{"type":"ping"}` frame are matched.
 * Comparators receive the parsed json too (`haveEntries({ type: 'ping' })`),
 * falling back to the frame text when the frame is not a json
 */
const resolveActualData = (raw: WsFrame['raw'], isTextExpected: boolean) => {
  const text = toText(raw);
  if (isTextExpected) return text;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

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

    const actualData = resolveActualData(frame.raw, typeof valueOrComparator === 'string');

    const comparator = isComparator(valueOrComparator)
      ? valueOrComparator
      : equals(valueOrComparator);

    return resolveEntityValues({ actual: actualData, comparator });
  });
};
