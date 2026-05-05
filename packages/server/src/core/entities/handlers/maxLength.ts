import { createComparator } from '@/utils/helpers';

export const maxLength = (expected: number) =>
  createComparator((actual, { maxLength }) => maxLength(actual, expected));
