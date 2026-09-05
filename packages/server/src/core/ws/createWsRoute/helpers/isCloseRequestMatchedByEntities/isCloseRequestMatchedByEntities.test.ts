import { describe, expect, it } from 'vitest';

import { equals } from '../../../../entities';
import { isCloseRequestMatchedByEntities } from './isCloseRequestMatchedByEntities';

const close = { code: 1000, reason: 'normal closure' };

describe('isCloseRequestMatchedByEntities', () => {
  it('Should match route configuration without entities', () => {
    expect(isCloseRequestMatchedByEntities(close, undefined)).toBe(true);
  });

  it('Should match by code', () => {
    expect(isCloseRequestMatchedByEntities(close, { code: 1000 })).toBe(true);
    expect(isCloseRequestMatchedByEntities(close, { code: 1006 })).toBe(false);
  });

  it('Should match by reason', () => {
    expect(isCloseRequestMatchedByEntities(close, { reason: 'normal closure' })).toBe(true);
    expect(isCloseRequestMatchedByEntities(close, { reason: 'server error' })).toBe(false);
  });

  it('Should match by comparator', () => {
    expect(isCloseRequestMatchedByEntities(close, { code: equals(1000) })).toBe(true);
  });

  it('Should match only when every entity is matched', () => {
    expect(isCloseRequestMatchedByEntities(close, { code: 1000, reason: 'normal closure' })).toBe(
      true
    );
    expect(isCloseRequestMatchedByEntities(close, { code: 1000, reason: 'server error' })).toBe(
      false
    );
  });
});
