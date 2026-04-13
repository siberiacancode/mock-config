import type { FnComparator } from '@/utils/helpers';

export const exists =
  (): FnComparator =>
  (actual, { exists }) =>
    exists(actual);

export const notExists =
  (): FnComparator =>
  (actual, { notExists }) =>
    notExists(actual);

export const equals =
  (expected: unknown): FnComparator =>
  (actual, { equals }) =>
    equals(actual, expected);

export const notEquals =
  (expected: unknown): FnComparator =>
  (actual, { notEquals }) =>
    notEquals(actual, expected);

export const includes =
  (expected: unknown): FnComparator =>
  (actual, { includes }) =>
    includes(actual, expected);

export const notIncludes =
  (expected: unknown): FnComparator =>
  (actual, { notIncludes }) =>
    notIncludes(actual, expected);

export const startsWith =
  (expected: unknown): FnComparator =>
  (actual, { startsWith }) =>
    startsWith(actual, expected);

export const notStartsWith =
  (expected: unknown): FnComparator =>
  (actual, { notStartsWith }) =>
    notStartsWith(actual, expected);

export const endsWith =
  (expected: unknown): FnComparator =>
  (actual, { endsWith }) =>
    endsWith(actual, expected);

export const notEndsWith =
  (expected: unknown): FnComparator =>
  (actual, { notEndsWith }) =>
    notEndsWith(actual, expected);

export const regExp =
  (expected: RegExp): FnComparator =>
  (actual, { regExp }) =>
    regExp(actual, expected);

export const fn =
  (expected: FnComparator): FnComparator =>
  (actual, { fn }) =>
    fn(actual, expected);

export const oneOf =
  (...comparators: FnComparator[]): FnComparator =>
  (actual, { fn }) =>
    comparators.some((comparator) => fn(actual, comparator));
