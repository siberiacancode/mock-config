import { flatten } from 'flat';

import type { Comparator, PlainObject } from '@/utils/types';

import { isPlainObject } from '../../isPlainObject/isPlainObject';
import { isPrimitive } from '../../isPrimitive/isPrimitive';
import { isComparator } from '../isComparator/isComparator';

const isIterable = (value: any): value is Iterable<unknown> =>
  value != null && typeof value[Symbol.iterator] === 'function';

const getLength = (value: unknown) => {
  if (isIterable(value)) {
    return [...value].length;
  }

  return Number.NaN;
};

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

export type HaveTypeTypes =
  | 'array'
  | 'bigint'
  | 'boolean'
  | 'function'
  | 'null'
  | 'number'
  | 'object'
  | 'string'
  | 'symbol'
  | 'undefined';

const comparators = {
  fn: (actual: unknown, expected: Comparator) => expected(actual, comparators),

  exists: (actual: unknown) => actual !== undefined,

  equals: (actual: unknown, expected: unknown) => {
    if (isObjectLike(actual) && isObjectLike(expected)) {
      return compareComplex(actual, expected, (a, b) => a === b);
    }
    return comparePrimitive(actual, expected, (a, b) => a === b);
  },

  includes: (actual: unknown, expected: unknown) => {
    if (isIterable(actual)) {
      if (isPrimitive(actual)) return actual.includes(String(expected));
      return [...actual].some((value) => JSON.stringify(value) === JSON.stringify(expected));
    }
    return false;
  },

  startsWith: (actual: unknown, expected: unknown) => {
    if (isIterable(actual)) {
      if (isPrimitive(actual)) return actual.startsWith(String(expected));
      return JSON.stringify([...actual].at(0)).startsWith(JSON.stringify(expected));
    }
    return false;
  },

  endsWith: (actual: unknown, expected: unknown) => {
    if (isIterable(actual)) {
      if (isPrimitive(actual)) return actual.startsWith(String(expected));
      return JSON.stringify([...actual].at(-1)).endsWith(JSON.stringify(expected));
    }
    return false;
  },

  regExp: (actual: unknown, expected: RegExp) => new RegExp(expected).test(String(actual)),

  greater: (actual: unknown, expected: number) => Number(actual) > expected,

  greaterOrEquals: (actual: unknown, expected: number) => Number(actual) >= expected,

  less: (actual: unknown, expected: number) => Number(actual) < expected,

  lessOrEquals: (actual: unknown, expected: number) => Number(actual) <= expected,

  length: (actual: unknown, expected: number) => {
    const actualLength = getLength(actual);
    return actualLength === expected;
  },

  minLength: (actual: unknown, expected: number) => {
    const actualLength = getLength(actual);
    return actualLength >= expected;
  },

  maxLength: (actual: unknown, expected: number) => {
    const actualLength = getLength(actual);
    return actualLength <= expected;
  },

  inRange: (actual: unknown, expected: [number, number]) => {
    const [min, max] = expected;
    return Number(actual) >= min && Number(actual) <= max;
  },

  haveType: (actual: unknown, expected: HaveTypeTypes) => {
    if (expected === 'array') return Array.isArray(actual);
    if (expected === 'null') return actual === null;
    // eslint-disable-next-line valid-typeof
    return typeof actual === expected;
  },

  haveEntries: (actual: unknown, expected: any[] | PlainObject) => {
    if (!isObjectLike(actual) || !isObjectLike(expected)) {
      return false;
    }

    const actualFlatten = normalize(actual);
    const expectedFlatten = normalize(expected);
    console.log('actualFlatten=', actualFlatten);
    console.log('expectedFlatten=', expectedFlatten);
    return Object.entries(expectedFlatten).every(([expectedFlattenKey, expectedValue]) => {
      if (isComparator(expectedValue)) {
        return comparators.fn(actualFlatten[expectedFlattenKey], expectedValue);
      }
      return comparators.equals(actualFlatten[expectedFlattenKey], expectedValue);
    });
  }
};

export type Comparators = typeof comparators;

interface ResolveEntityValuesParams {
  actual: unknown;
  comparator: Comparator;
}

export const resolveEntityValues = ({ actual, comparator }: ResolveEntityValuesParams) =>
  comparator(actual, comparators);
