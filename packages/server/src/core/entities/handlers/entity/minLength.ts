import { createComparator } from '@/utils/helpers';

export const minLength = (expected: number) =>
  createComparator((actual, { minLength }) => minLength(actual, expected));
