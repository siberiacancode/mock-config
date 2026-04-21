import type { Comparator } from '@/utils/types';

import { IS_COMPARATOR_SYMBOL } from '@/utils/constants';

export const isComparator = (value: unknown): value is Comparator =>
  typeof value === 'function' && IS_COMPARATOR_SYMBOL in value;
