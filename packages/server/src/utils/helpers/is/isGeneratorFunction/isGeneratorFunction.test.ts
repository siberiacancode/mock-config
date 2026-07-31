import { describe, expect, it } from 'vitest';

import { isGeneratorFunction } from './isGeneratorFunction';

describe('isGeneratorFunction', () => {
  it('Should return true for generator function value', () => {
    expect(
      isGeneratorFunction(function* () {
        yield 1;
      })
    ).toBe(true);
  });

  it('Should return false for common function value', () => {
    expect(isGeneratorFunction(() => 1)).toBe(false);
  });
});
