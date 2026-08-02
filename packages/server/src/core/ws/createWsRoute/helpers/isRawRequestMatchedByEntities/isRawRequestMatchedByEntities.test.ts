import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';

import { equals } from '../../../../entities';
import { isRawRequestMatchedByEntities } from './isRawRequestMatchedByEntities';

describe('isRawRequestMatchedByEntities', () => {
  it('Should match route configuration without entities', () => {
    expect(isRawRequestMatchedByEntities({ isBinary: false, raw: 'ping' }, undefined)).toBe(true);
  });

  it('Should match text frame by string data', () => {
    expect(isRawRequestMatchedByEntities({ isBinary: false, raw: 'ping' }, { data: 'ping' })).toBe(
      true
    );
    expect(isRawRequestMatchedByEntities({ isBinary: false, raw: 'ping' }, { data: 'pong' })).toBe(
      false
    );
  });

  it('Should match text frame by parsed json data', () => {
    const frame = { isBinary: false, raw: '{"type":"ping","id":1}' } as const;

    expect(isRawRequestMatchedByEntities(frame, { data: { type: 'ping', id: 1 } })).toBe(true);
    expect(isRawRequestMatchedByEntities(frame, { data: { type: 'pong', id: 1 } })).toBe(false);
  });

  it('Should match by isBinary', () => {
    expect(
      isRawRequestMatchedByEntities({ isBinary: false, raw: 'ping' }, { isBinary: false })
    ).toBe(true);
    expect(isRawRequestMatchedByEntities({ isBinary: false, raw: 'ping' }, { isBinary: true })).toBe(
      false
    );
  });

  it('Should match binary frame by buffer data', () => {
    const frame = { isBinary: true, raw: Buffer.from('ping') } as const;

    expect(isRawRequestMatchedByEntities(frame, { data: Buffer.from('ping') })).toBe(true);
    expect(isRawRequestMatchedByEntities(frame, { data: Buffer.from('pong') })).toBe(false);
  });

  it('Should match by comparator', () => {
    expect(
      isRawRequestMatchedByEntities(
        { isBinary: false, raw: '{"type":"ping"}' },
        { data: equals({ type: 'ping' }) }
      )
    ).toBe(true);
  });

  it('Should match only when every entity is matched', () => {
    const frame = { isBinary: false, raw: 'ping' } as const;

    expect(isRawRequestMatchedByEntities(frame, { data: 'ping', isBinary: false })).toBe(true);
    expect(isRawRequestMatchedByEntities(frame, { data: 'ping', isBinary: true })).toBe(false);
  });
});
