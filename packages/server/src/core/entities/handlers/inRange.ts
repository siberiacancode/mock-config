import { createComparator } from '@/utils/helpers';

export const inRange = (expected: [number, number]) =>
  createComparator((actual, { inRange }) => inRange(actual, expected));
