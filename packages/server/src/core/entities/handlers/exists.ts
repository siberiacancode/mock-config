import { createComparator } from '@/utils/helpers';

export const exists = () =>
  createComparator((actual, { exists }) => exists(actual), { name: 'exists', args: [] });
