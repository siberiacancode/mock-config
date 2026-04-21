import type { Comparator } from '@/utils/types';

import { IS_COMPARATOR_SYMBOL } from '@/utils/constants';

import type { Comparators } from '../resolveEntityValues/resolveEntityValues';

export const createComparator = (fn: (actual: unknown, comparators: Comparators) => boolean) => {
  (fn as Comparator)[IS_COMPARATOR_SYMBOL] = true;
  return fn as Comparator;
};
