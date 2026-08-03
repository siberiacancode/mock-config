import { describe, expect, it } from 'vitest';

import { isIterable } from './isIterable';

describe('isIterable', () => {
  it('Iterable values should return true', () => {
    expect(isIterable('value')).toBe(true);
    expect(isIterable([1, 2, 3])).toBe(true);
    expect(isIterable(new Set([1, 2, 3]))).toBe(true);
    expect(isIterable(new Map([['key', 'value']]))).toBe(true);
  });

  it('Non iterable values should return false', () => {
    expect(isIterable(1)).toBe(false);
    expect(isIterable({ key: 'value' })).toBe(false);
    expect(isIterable(() => {})).toBe(false);
    expect(isIterable(undefined)).toBe(false);
    expect(isIterable(null)).toBe(false);
  });
});
