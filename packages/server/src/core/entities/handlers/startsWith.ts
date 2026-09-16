import { createComparator } from '@/utils/helpers';

export const startsWith = (expected: unknown) =>
  createComparator((actual, { startsWith }) => startsWith(actual, expected), {
    name: 'startsWith',
    args: [expected]
  });
