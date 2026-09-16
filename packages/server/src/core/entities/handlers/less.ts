import { createComparator } from '@/utils/helpers';

export const less = (expected: number) =>
  createComparator((actual, { less }) => less(actual, expected), {
    name: 'less',
    args: [expected]
  });
