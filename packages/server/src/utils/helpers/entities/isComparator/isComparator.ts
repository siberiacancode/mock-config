import type { FnComparator } from '@/utils/helpers';

export const isComparator = <ActualValue>(value: unknown): value is FnComparator<ActualValue> =>
  typeof value === 'function';
