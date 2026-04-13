import type { FnComparator, HaveTypeTypes } from '@/utils/helpers';

export const exists =
  (): FnComparator =>
  (actual, { exists }) =>
    exists(actual);

export const equals =
  (expected: unknown): FnComparator =>
  (actual, { equals }) =>
    equals(actual, expected);

export const includes =
  (expected: unknown): FnComparator =>
  (actual, { includes }) =>
    includes(actual, expected);

export const startsWith =
  (expected: unknown): FnComparator =>
  (actual, { startsWith }) =>
    startsWith(actual, expected);

export const endsWith =
  (expected: unknown): FnComparator =>
  (actual, { endsWith }) =>
    endsWith(actual, expected);

export const regExp =
  (expected: RegExp): FnComparator =>
  (actual, { regExp }) =>
    regExp(actual, expected);

export const fn =
  (expected: FnComparator): FnComparator =>
  (actual, { fn }) =>
    fn(actual, expected);

export const greater =
  (expected: number): FnComparator =>
  (actual, { greater }) =>
    greater(actual, expected);

export const greaterOrEquals =
  (expected: number): FnComparator =>
  (actual, { greaterOrEquals }) =>
    greaterOrEquals(actual, expected);

export const less =
  (expected: number): FnComparator =>
  (actual, { less }) =>
    less(actual, expected);

export const lessOrEquals =
  (expected: number): FnComparator =>
  (actual, { lessOrEquals }) =>
    lessOrEquals(actual, expected);

export const length =
  (expected: number): FnComparator =>
  (actual, { length }) =>
    length(actual, expected);

export const minLength =
  (expected: number): FnComparator =>
  (actual, { minLength }) =>
    minLength(actual, expected);

export const maxLength =
  (expected: number): FnComparator =>
  (actual, { maxLength }) =>
    maxLength(actual, expected);

export const inRange =
  (expected: [number, number]): FnComparator =>
  (actual, { inRange }) =>
    inRange(actual, expected);

export const haveType =
  (expected: HaveTypeTypes): FnComparator =>
  (actual, { haveType }) =>
    haveType(actual, expected);

export const some =
  (...comparators: FnComparator[]): FnComparator =>
  (actual, { fn }) =>
    comparators.some((comparator) => fn(actual, comparator));

export const every =
  (...comparators: FnComparator[]): FnComparator =>
  (actual, { fn }) =>
    comparators.every((comparator) => fn(actual, comparator));

export const not =
  (comparator: FnComparator): FnComparator =>
  (actual, { fn }) =>
    !fn(actual, comparator);
