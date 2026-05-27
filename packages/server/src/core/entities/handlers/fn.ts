import type { FnComparator } from '@/utils/helpers';

import { createComparator } from '@/utils/helpers';

export const fn = (comparator: FnComparator) =>
  createComparator((actual, { fn }) => fn(actual, createComparator(comparator)));
