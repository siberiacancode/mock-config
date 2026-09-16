import type { Comparator, ComparatorMeta } from '@/utils/types';

import { COMPARATOR_META_SYMBOL, IS_COMPARATOR_SYMBOL } from '@/utils/constants';

import type { Comparators } from '../resolveEntityValues/resolveEntityValues';

export const createComparator = (
  fn: (actual: unknown, comparators: Comparators) => boolean,
  meta?: ComparatorMeta
) => {
  const comparator = fn as Comparator;

  comparator[IS_COMPARATOR_SYMBOL] = true;
  if (meta) comparator[COMPARATOR_META_SYMBOL] = meta;

  return comparator;
};
