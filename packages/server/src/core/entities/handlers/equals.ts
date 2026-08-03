import { createComparator } from '@/utils/helpers';

export const equals = (expected: unknown) =>
  createComparator((actual, { equals }) => equals(actual, expected), {
    name: 'equals',
    args: [expected]
  });
