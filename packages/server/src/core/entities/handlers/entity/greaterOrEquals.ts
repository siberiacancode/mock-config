import { createComparator } from '@/utils/helpers';

export const greaterOrEquals = (expected: number) =>
  createComparator((actual, { greaterOrEquals }) => greaterOrEquals(actual, expected));
