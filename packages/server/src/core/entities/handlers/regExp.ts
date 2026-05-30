import { createComparator } from '@/utils/helpers';

export const regExp = (regExpLike: string | RegExp) =>
  createComparator((actual, { regExp }) => regExp(actual, regExpLike));
