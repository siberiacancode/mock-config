import type { Comparator } from '@/utils/types';

import { createComparator } from '@/utils/helpers';

export const fn = (expected: Comparator) =>
  createComparator((actual, { fn }) => fn(actual, expected));
