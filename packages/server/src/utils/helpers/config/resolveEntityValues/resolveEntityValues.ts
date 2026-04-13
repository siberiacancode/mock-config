import { flatten } from 'flat';

import type { PlainObject } from '@/utils/types';

import { isPlainObject } from '../../isPlainObject/isPlainObject';
import { isPrimitive } from '../../isPrimitive/isPrimitive';

const isIterable = (value: any): value is Iterable<unknown> =>
  value != null && typeof value[Symbol.iterator] === 'function';

const isObjectLike = (value: unknown) => isPlainObject(value) || Array.isArray(value);

const normalize = (value: any) => {
  if (isObjectLike(value)) {
    return flatten<PlainObject | unknown[], PlainObject>(value);
  }
  return value;
};

const comparePrimitive = (
  actual: unknown,
  expected: unknown,
  predicate: (a: unknown, b: unknown) => boolean
) => predicate(actual, expected);

const compareComplex = (
  actual: unknown,
  expected: unknown,
  predicate: (a: string, b: string) => boolean,
  negative = false
) => {
  const a = normalize(actual);
  const b = normalize(expected);
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return negative;
  }

  const method = negative ? 'some' : 'every';

  return bKeys[method]((key) => predicate(String(a[key]), String(b[key])));
};

export type FnComparator<ActualValue = unknown> = (
  actual: ActualValue,
  comparators: Comparators
) => boolean;

const comparators = {
  exists: (actual: unknown) => actual !== undefined,
  notExists: (actual: unknown) => !comparators.exists(actual),

  equals: (actual: unknown, expected: unknown) => {
    if (isObjectLike(actual) && isObjectLike(expected)) {
      return compareComplex(actual, expected, (a, b) => a === b);
    }
    return comparePrimitive(actual, expected, (a, b) => a === b);
  },
  notEquals: (actual: unknown, expected: unknown) => !comparators.equals(actual, expected),

  includes: (actual: unknown, expected: unknown) => {
    if (isIterable(actual)) {
      if (isPrimitive(actual)) return actual.includes(String(expected));
      return [...actual].some((value) => JSON.stringify(value) === JSON.stringify(expected));
    }
    return false;
  },
  notIncludes: (actual: unknown, expected: unknown) => !comparators.includes(actual, expected),

  startsWith: (actual: unknown, expected: unknown) => {
    if (isIterable(actual)) {
      if (isPrimitive(actual)) return actual.startsWith(String(expected));
      return JSON.stringify([...actual].at(0)).startsWith(JSON.stringify(expected));
    }
    return false;
  },
  notStartsWith: (actual: unknown, expected: unknown) => !comparators.startsWith(actual, expected),

  endsWith: (actual: unknown, expected: unknown) => {
    if (isIterable(actual)) {
      if (isPrimitive(actual)) return actual.startsWith(String(expected));
      return JSON.stringify([...actual].at(-1)).startsWith(JSON.stringify(expected));
    }
    return false;
  },
  notEndsWith: (actual: unknown, expected: unknown) => !comparators.endsWith(actual, expected),

  regExp: (actual: unknown, expected: RegExp) => new RegExp(expected).test(String(actual)),

  fn: (actual: unknown, expected: FnComparator) => expected(actual, comparators)
};

type Comparators = typeof comparators;

interface ResolveEntityValuesParams {
  actual: unknown;
  comparator: FnComparator;
}

export const resolveEntityValues = ({ actual, comparator }: ResolveEntityValuesParams) =>
  comparator(actual, comparators);
