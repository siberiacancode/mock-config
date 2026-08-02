import { createComparator } from '@/utils/helpers';

export const length = (expected: number) =>
  createComparator((actual, { length }) => length(actual, expected), {
    name: 'length',
    args: [expected]
  });
