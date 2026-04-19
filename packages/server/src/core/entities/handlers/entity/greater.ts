import { createComparator } from '@/utils/helpers';

export const greater = (expected: number) =>
  createComparator((actual, { greater }) => greater(actual, expected));
