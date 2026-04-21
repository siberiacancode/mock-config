import type { HaveTypeTypes } from '@/utils/helpers';

import { createComparator } from '@/utils/helpers';

export const haveType = (expected: HaveTypeTypes) =>
  createComparator((actual, { haveType }) => haveType(actual, expected));
