import { createComparator } from '@/utils/helpers';

export const regExp = (expected: RegExp) =>
  createComparator((actual, { regExp }) => regExp(actual, expected));
