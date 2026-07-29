import { describe, expect, it } from 'vitest';

import { createGenerator } from './createGenerator';

describe('createGenerator', () => {
  it('Should preserve returned generator value before restarting', () => {
    const handler = createGenerator(function* (): Generator<number, number, undefined> {
      yield 1;
      return 2;
    });

    expect(handler(undefined)).toBe(1);
    expect(handler(undefined)).toBe(2);
    expect(handler(undefined)).toBe(1);
  });

  it('Should return generator return value when generator has no yielded values', () => {
    const handler = createGenerator(function* (): Generator<number, number, undefined> {
      return 1;
    });

    expect(handler(undefined)).toBe(1);
    expect(handler(undefined)).toBe(1);
  });
});
