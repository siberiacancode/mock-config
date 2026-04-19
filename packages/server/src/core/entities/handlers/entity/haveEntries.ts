import type { PlainObject } from '@/utils/types';

import { createComparator } from '@/utils/helpers';

export const haveEntries = (expected: any[] | PlainObject) =>
  createComparator((actual, { haveEntries }) => haveEntries(actual, expected));
