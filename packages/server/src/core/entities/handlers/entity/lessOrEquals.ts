import { createComparator } from '@/utils/helpers';

export const lessOrEquals = (expected: number) =>
  createComparator((actual, { lessOrEquals }) => lessOrEquals(actual, expected));
