import type { HaveTypeType } from '@/utils/helpers';

import { createComparator } from '@/utils/helpers';

export const haveType = (type: HaveTypeType) =>
  createComparator((actual, { haveType }) => haveType(actual, type));
