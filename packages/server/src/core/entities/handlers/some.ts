import type { Comparator } from '@/utils/types';

import { createComparator } from '@/utils/helpers';

export const some = (...comparators: Comparator[]) =>
  createComparator((actual, { fn }) => comparators.some((comparator) => fn(actual, comparator)));
