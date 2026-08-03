import type { PlainObject } from '@/utils/types';

import { createComparator } from '@/utils/helpers';

export const haveEntries = (entry: any[] | PlainObject) =>
  createComparator((actual, { haveEntries }) => haveEntries(actual, entry), {
    name: 'haveEntries',
    args: [entry]
  });
