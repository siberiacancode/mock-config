import type { Comparator } from '@/utils/types';

import { createComparator } from '@/utils/helpers';

export const not = (comparator: Comparator) =>
  createComparator((actual, { fn }) => !fn(actual, comparator), {
    name: 'not',
    args: [comparator]
  });
