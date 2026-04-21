import type { Comparator } from '@/utils/types';

import { createComparator } from '@/utils/helpers';

export const oneOf = (...comparators: Comparator[]) =>
  createComparator(
    (actual, { fn }) => comparators.filter((comparator) => fn(actual, comparator)).length === 1
  );
