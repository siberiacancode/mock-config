import { describe, expect, it, vi } from 'vitest';

import type { Comparators } from './resolveEntityValues';

import { createComparator } from '../createComparator/createComparator';
import { resolveEntityValues } from './resolveEntityValues';

const resolve = (name: keyof Comparators, actual: unknown, expected?: unknown) =>
  resolveEntityValues({
    actual,
    comparator: createComparator((actualValue, comparators) =>
      (comparators[name] as (actual: unknown, expected: unknown) => boolean)(actualValue, expected)
    )
  });

describe('resolveEntityValues', () => {
  it('Should pass actual value and comparators to the comparator', () => {
    const comparator = vi.fn();

    resolveEntityValues({ actual: 'primitive', comparator: createComparator(comparator) });

    expect(comparator).toBeCalledTimes(1);
    expect(comparator).toBeCalledWith(
      'primitive',
      expect.objectContaining({ equals: expect.any(Function), haveEntries: expect.any(Function) })
    );
  });

  it('Should return the comparator result', () => {
    expect(
      resolveEntityValues({ actual: 'primitive', comparator: createComparator(() => true) })
    ).toBe(true);
    expect(
      resolveEntityValues({ actual: 'primitive', comparator: createComparator(() => false) })
    ).toBe(false);
  });

  it('Should support nested comparators through fn', () => {
    const nestedComparator = createComparator((actual, { equals }) => equals(actual, 'primitive'));

    expect(resolve('fn', 'primitive', nestedComparator)).toBe(true);
    expect(resolve('fn', 'other', nestedComparator)).toBe(false);
  });

  it('Should treat only undefined as non-existing', () => {
    const existedValues = ['string', 0, false, null, {}, []];
    existedValues.forEach((value) => {
      expect(resolve('exists', value)).toBe(true);
    });

    expect(resolve('exists', undefined)).toBe(false);
  });

  it('Should compare primitives strictly in equals', () => {
    expect(resolve('equals', 'primitive', 'primitive')).toBe(true);
    expect(resolve('equals', '12', 12)).toBe(false);
  });

  it('Should compare object-like values by flattened entries in equals', () => {
    expect(resolve('equals', { user: { name: 'John' } }, { user: { name: 'John' } })).toBe(true);
    expect(
      resolve(
        'equals',
        ['primitive', { property: 'primitive' }],
        ['primitive', { property: 'primitive' }]
      )
    ).toBe(true);
    expect(resolve('equals', { user: { name: 'John' } }, { user: { name: 'Jane' } })).toBe(false);
  });

  it('Should return false in equals when flattened key counts differ', () => {
    expect(resolve('equals', { id: 1, name: 'John' }, { id: 1 })).toBe(false);
  });

  it('Should ignore leaf value types in object-like equals', () => {
    expect(resolve('equals', { id: 1 }, { id: '1' })).toBe(true);
  });

  it('Should return false in equals when object-like and primitive are compared', () => {
    expect(resolve('equals', ['primitive'], 'primitive')).toBe(false);
    expect(resolve('equals', 'primitive', ['primitive'])).toBe(false);
  });

  it('Should find a substring in includes', () => {
    expect(resolve('includes', 'primitive', 'imi')).toBe(true);
    expect(resolve('includes', '12345', 12)).toBe(true);
    expect(resolve('includes', 'primitive', 'xyz')).toBe(false);
  });

  it('Should find an element of an iterable in includes', () => {
    expect(
      resolve('includes', ['primitive', { property: 'primitive' }], { property: 'primitive' })
    ).toBe(true);
    expect(resolve('includes', ['primitive'], { property: 'primitive' })).toBe(false);
  });

  it('Should return false in includes for non-iterable actual', () => {
    const nonIterableValues = [12345, { property: 'primitive' }, null];
    nonIterableValues.forEach((actual) => {
      expect(resolve('includes', actual, 'primitive')).toBe(false);
    });
  });

  it('Should match the beginning of a string in startsWith', () => {
    expect(resolve('startsWith', 'primitive', 'pri')).toBe(true);
    expect(resolve('startsWith', 'primitive', 'imi')).toBe(false);
  });

  it('Should match the first element of an iterable in startsWith', () => {
    expect(
      resolve('startsWith', [{ property: 'primitive' }, 'other'], { property: 'primitive' })
    ).toBe(true);
    expect(
      resolve('startsWith', ['other', { property: 'primitive' }], { property: 'primitive' })
    ).toBe(false);
  });

  it('Should match the end of a string in endsWith', () => {
    expect(resolve('endsWith', 'primitive', 'ive')).toBe(true);
    expect(resolve('endsWith', 'primitive', 'pri')).toBe(false);
  });

  it('Should match the last element of an iterable in endsWith', () => {
    expect(
      resolve('endsWith', ['other', { property: 'primitive' }], { property: 'primitive' })
    ).toBe(true);
    expect(
      resolve('endsWith', [{ property: 'primitive' }, 'other'], { property: 'primitive' })
    ).toBe(false);
  });

  it('Should return false in startsWith and endsWith for non-iterable actual', () => {
    const iterableComparators = ['startsWith', 'endsWith'] as const;
    iterableComparators.forEach((name) => {
      expect(resolve(name, 12345, '123')).toBe(false);
      expect(resolve(name, { property: 'primitive' }, 'primitive')).toBe(false);
    });
  });

  it('Should test actual against RegExp and string patterns in regExp', () => {
    expect(resolve('regExp', 'string', /string/)).toBe(true);
    expect(resolve('regExp', 'string', 'string')).toBe(true);
    expect(resolve('regExp', 'String', /string/)).toBe(false);
    expect(resolve('regExp', 12345, '\\d+')).toBe(true);
  });

  it('Should be independent of RegExp lastIndex when the pattern uses the g flag', () => {
    const regExpWithGlobalFlag = /string/g;

    expect(resolve('regExp', 'string', regExpWithGlobalFlag)).toBe(true);
    expect(resolve('regExp', 'string', regExpWithGlobalFlag)).toBe(true);
  });

  it('Should compare numbers in greater, greaterOrEquals, less and lessOrEquals', () => {
    const greaterComparators = ['greater', 'greaterOrEquals'] as const;
    greaterComparators.forEach((name) => {
      expect(resolve(name, 10, 5)).toBe(true);
      expect(resolve(name, 5, 10)).toBe(false);
    });

    const lessComparators = ['less', 'lessOrEquals'] as const;
    lessComparators.forEach((name) => {
      expect(resolve(name, 5, 10)).toBe(true);
      expect(resolve(name, 10, 5)).toBe(false);
    });
  });

  it('Should include the boundary only in greaterOrEquals and lessOrEquals', () => {
    expect(resolve('greater', 5, 5)).toBe(false);
    expect(resolve('less', 5, 5)).toBe(false);
    expect(resolve('greaterOrEquals', 5, 5)).toBe(true);
    expect(resolve('lessOrEquals', 5, 5)).toBe(true);
  });

  it('Should coerce actual to number in numeric comparators', () => {
    expect(resolve('greater', '42', 41)).toBe(true);

    const numericComparators = ['greater', 'greaterOrEquals', 'less', 'lessOrEquals'] as const;
    numericComparators.forEach((name) => {
      expect(resolve(name, 'primitive', 5)).toBe(false);
    });
  });

  it('Should measure array length in length, minLength and maxLength', () => {
    expect(resolve('length', ['a', 'b', 'c'], 3)).toBe(true);
    expect(resolve('length', ['a', 'b', 'c'], 4)).toBe(false);
    expect(resolve('minLength', ['a', 'b', 'c'], 3)).toBe(true);
    expect(resolve('minLength', ['a', 'b', 'c'], 4)).toBe(false);
    expect(resolve('maxLength', ['a', 'b', 'c'], 3)).toBe(true);
    expect(resolve('maxLength', ['a', 'b', 'c'], 2)).toBe(false);
  });

  it('Should measure non-array iterables by spreading them', () => {
    expect(resolve('length', 'abc', 3)).toBe(true);
    expect(resolve('length', new Set(['a', 'b', 'c']), 3)).toBe(true);
  });

  it('Should return false in length comparators for non-iterable actual', () => {
    const lengthComparators = ['length', 'minLength', 'maxLength'] as const;
    lengthComparators.forEach((name) => {
      expect(resolve(name, 12345, 5)).toBe(false);
      expect(resolve(name, { property: 'primitive' }, 1)).toBe(false);
    });
  });

  it('Should include both bounds in inRange', () => {
    expect(resolve('inRange', 5, [1, 10])).toBe(true);
    expect(resolve('inRange', 1, [1, 10])).toBe(true);
    expect(resolve('inRange', 10, [1, 10])).toBe(true);
    expect(resolve('inRange', '5', [1, 10])).toBe(true);
    expect(resolve('inRange', 0, [1, 10])).toBe(false);
    expect(resolve('inRange', 11, [1, 10])).toBe(false);
  });

  it('Should detect value type in haveType', () => {
    const typedValues = [
      [[], 'array'],
      [null, 'null'],
      ['primitive', 'string'],
      [12345, 'number'],
      [true, 'boolean'],
      [undefined, 'undefined'],
      [() => {}, 'function'],
      [{}, 'object']
    ] as const;
    typedValues.forEach(([value, type]) => {
      expect(resolve('haveType', value, type)).toBe(true);
    });

    expect(resolve('haveType', 'primitive', 'number')).toBe(false);
    expect(resolve('haveType', {}, 'array')).toBe(false);
  });

  it('Should match a flattened subset of entries in haveEntries', () => {
    const actual = { user: { name: 'John', age: 20 }, id: 1 };

    expect(resolve('haveEntries', actual, { user: { name: 'John' } })).toBe(true);
    expect(resolve('haveEntries', actual, { 'user.name': 'John' })).toBe(true);
  });

  it('Should match array entries by index in haveEntries', () => {
    expect(resolve('haveEntries', ['a', 'b'], ['a'])).toBe(true);
    expect(resolve('haveEntries', ['a', 'b'], ['b'])).toBe(false);
  });

  it('Should return false in haveEntries when a key is missing or differs', () => {
    expect(resolve('haveEntries', { id: 1 }, { name: 'John' })).toBe(false);
    expect(resolve('haveEntries', { id: 1 }, { id: 2 })).toBe(false);
  });

  it('Should apply nested comparators inside haveEntries entries', () => {
    const olderThanEighteen = createComparator((actual, { greater }) => greater(actual, 18));

    expect(resolve('haveEntries', { age: 20 }, { age: olderThanEighteen })).toBe(true);
    expect(resolve('haveEntries', { age: 15 }, { age: olderThanEighteen })).toBe(false);
  });

  it('Should return false in haveEntries when actual or entry is not object-like', () => {
    expect(resolve('haveEntries', 'primitive', { id: 1 })).toBe(false);
    expect(resolve('haveEntries', { id: 1 }, 'primitive')).toBe(false);
  });

  it('Should handle an empty iterable in startsWith and endsWith', () => {
    expect(resolve('startsWith', [], 'primitive')).toBe(false);
    expect(resolve('endsWith', [], 'primitive')).toBe(false);
  });
});
