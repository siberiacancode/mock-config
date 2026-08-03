import { createComparator } from '@/utils/helpers';

export const greater = (expected: number) =>
  createComparator((actual, { greater }) => greater(actual, expected), {
    name: 'greater',
    args: [expected]
  });
