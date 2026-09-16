import { createComparator } from '@/utils/helpers';

export const includes = (expected: unknown) =>
  createComparator((actual, { includes }) => includes(actual, expected), {
    name: 'includes',
    args: [expected]
  });
