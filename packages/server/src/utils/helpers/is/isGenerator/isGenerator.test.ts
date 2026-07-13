import { describe, expect, it } from 'vitest';

import { isGenerator } from './isGenerator';

describe('isGenerator', () => {
  it('Generator function value should return true', () => {
    expect(
      isGenerator(function* () {
        yield 1;
      })
    ).toBe(true);
  });

  it('Common function value should return false', () => {
    expect(isGenerator(() => 1)).toBe(false);
  });

  it('Non function values should return false', () => {
    expect(isGenerator(1 as never)).toBe(false);
    expect(isGenerator({} as never)).toBe(false);
    expect(isGenerator(null as never)).toBe(false);
  });
});
