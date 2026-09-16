import { createComparator } from '@/utils/helpers';

export const inRange = (range: [number, number]) =>
  createComparator((actual, { inRange }) => inRange(actual, range), {
    name: 'inRange',
    args: [range]
  });
