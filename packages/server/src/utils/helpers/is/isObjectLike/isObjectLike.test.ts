import { describe, expect, it } from 'vitest';

import { isObjectLike } from './isObjectLike';

describe('isObjectLike', () => {
  it('Plain objects and arrays should return true', () => {
    expect(isObjectLike({ key: 'value' })).toBe(true);
    expect(isObjectLike([1, 2, 3])).toBe(true);
  });

  it('Non object-like values should return false', () => {
    expect(isObjectLike('value')).toBe(false);
    expect(isObjectLike(1)).toBe(false);
    expect(isObjectLike(new Set([1, 2, 3]))).toBe(false);
    expect(isObjectLike(null)).toBe(false);
    expect(isObjectLike(undefined)).toBe(false);
  });
});
