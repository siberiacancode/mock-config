import type { Comparator } from '@/utils/types';

import { createComparator } from '@/utils/helpers';

export const every = (...comparators: Comparator[]) =>
  createComparator((actual, { fn }) => comparators.every((comparator) => fn(actual, comparator)));
