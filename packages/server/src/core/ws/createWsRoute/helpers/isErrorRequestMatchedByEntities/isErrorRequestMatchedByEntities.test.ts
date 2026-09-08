import { describe, expect, it } from 'vitest';

import { equals, regExp } from '../../../../entities';
import { isErrorRequestMatchedByEntities } from './isErrorRequestMatchedByEntities';

const error: NodeJS.ErrnoException = Object.assign(new Error('socket hang up'), {
  code: 'ECONNRESET'
});

describe('isErrorRequestMatchedByEntities', () => {
  it('Should match route configuration without entities', () => {
    expect(isErrorRequestMatchedByEntities(error, undefined)).toBe(true);
  });

  it('Should match by message', () => {
    expect(isErrorRequestMatchedByEntities(error, { message: 'socket hang up' })).toBe(true);
    expect(isErrorRequestMatchedByEntities(error, { message: 'server error' })).toBe(false);
  });

  it('Should match by code', () => {
    expect(isErrorRequestMatchedByEntities(error, { code: 'ECONNRESET' })).toBe(true);
    expect(isErrorRequestMatchedByEntities(error, { code: 'WS_ERR_INVALID_UTF8' })).toBe(false);
  });

  it('Should match only when every entity is matched', () => {
    expect(
      isErrorRequestMatchedByEntities(error, { code: 'ECONNRESET', message: 'socket hang up' })
    ).toBe(true);
    expect(
      isErrorRequestMatchedByEntities(error, { code: 'ECONNRESET', message: 'server error' })
    ).toBe(false);
  });

  it('Should match by comparator', () => {
    expect(isErrorRequestMatchedByEntities(error, { message: equals('socket hang up') })).toBe(
      true
    );
    expect(isErrorRequestMatchedByEntities(error, { message: regExp(/hang up$/) })).toBe(true);
    expect(isErrorRequestMatchedByEntities(error, { message: regExp(/^hang up/) })).toBe(false);
  });

  it('Should match route configuration with empty entities', () => {
    expect(isErrorRequestMatchedByEntities(error, {})).toBe(true);
  });
});
