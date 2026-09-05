import { describe, expect, it } from 'vitest';

import { equals, regExp } from '../../../../entities';
import { isErrorRequestMatchedByEntities } from './isErrorRequestMatchedByEntities';

const error = new Error('socket hang up');

describe('isErrorRequestMatchedByEntities', () => {
  it('Should match route configuration without entities', () => {
    expect(isErrorRequestMatchedByEntities(error, undefined)).toBe(true);
  });

  it('Should match by message', () => {
    expect(isErrorRequestMatchedByEntities(error, { message: 'socket hang up' })).toBe(true);
    expect(isErrorRequestMatchedByEntities(error, { message: 'server error' })).toBe(false);
  });

  it('Should match by comparator', () => {
    expect(isErrorRequestMatchedByEntities(error, { message: equals('socket hang up') })).toBe(true);
    expect(isErrorRequestMatchedByEntities(error, { message: regExp(/hang up$/) })).toBe(true);
    expect(isErrorRequestMatchedByEntities(error, { message: regExp(/^hang up/) })).toBe(false);
  });

  it('Should match route configuration with empty entities', () => {
    expect(isErrorRequestMatchedByEntities(error, {})).toBe(true);
  });
});
