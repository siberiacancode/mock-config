import { describe, expect, it } from 'vitest';

import { isGeneratorFunction } from './isGeneratorFunction';

describe('isGeneratorFunction', () => {
  it('Generator function value should return true', () => {
    expect(
      isGeneratorFunction(function* () {
        yield 1;
      })
    ).toBe(true);
  });

  it('Common function value should return false', () => {
    expect(isGeneratorFunction(() => 1)).toBe(false);
  });
});
