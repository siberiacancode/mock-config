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
});
