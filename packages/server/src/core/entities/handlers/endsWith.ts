import { createComparator } from '@/utils/helpers';

export const endsWith = (expected: unknown) =>
  createComparator((actual, { endsWith }) => endsWith(actual, expected), {
    name: 'endsWith',
    args: [expected]
  });
