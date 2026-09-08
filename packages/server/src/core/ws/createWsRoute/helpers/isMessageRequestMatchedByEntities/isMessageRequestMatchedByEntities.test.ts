import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';

import type { WsFrame } from '@/utils/types';

import { equals } from '../../../../entities';
import { createWsFrame } from '../createWsFrame/createWsFrame';
import { isMessageRequestMatchedByEntities } from './isMessageRequestMatchedByEntities';

const textFrame = (raw: string): WsFrame => createWsFrame(Buffer.from(raw), false);
const binaryFrame = (raw: string): WsFrame => createWsFrame(Buffer.from(raw), true);

describe('isMessageRequestMatchedByEntities', () => {
  it('Should match route configuration without entities', () => {
    expect(isMessageRequestMatchedByEntities(textFrame('ping'), undefined)).toBe(true);
  });

  it('Should match text frame by string data', () => {
    expect(isMessageRequestMatchedByEntities(textFrame('ping'), { data: 'ping' })).toBe(true);
    expect(isMessageRequestMatchedByEntities(textFrame('ping'), { data: 'pong' })).toBe(false);
  });

  it('Should match text frame by decoded json data', () => {
    const frame = textFrame('{"type":"ping","id":1}');

    expect(isMessageRequestMatchedByEntities(frame, { data: { type: 'ping', id: 1 } })).toBe(true);
    expect(isMessageRequestMatchedByEntities(frame, { data: { type: 'pong', id: 1 } })).toBe(false);
  });

  it('Should match by isBinary', () => {
    expect(isMessageRequestMatchedByEntities(textFrame('ping'), { isBinary: false })).toBe(true);
    expect(isMessageRequestMatchedByEntities(textFrame('ping'), { isBinary: true })).toBe(false);
  });

  it('Should match binary frame by buffer data', () => {
    const frame = binaryFrame('ping');

    expect(isMessageRequestMatchedByEntities(frame, { data: Buffer.from('ping') })).toBe(true);
    expect(isMessageRequestMatchedByEntities(frame, { data: Buffer.from('pong') })).toBe(false);
  });

  it('Should match by comparator', () => {
    expect(
      isMessageRequestMatchedByEntities(textFrame('{"type":"ping"}'), {
        data: equals({ type: 'ping' })
      })
    ).toBe(true);
  });

  it('Should match only when every entity is matched', () => {
    const frame = textFrame('ping');

    expect(isMessageRequestMatchedByEntities(frame, { data: 'ping', isBinary: false })).toBe(true);
    expect(isMessageRequestMatchedByEntities(frame, { data: 'ping', isBinary: true })).toBe(false);
  });
});
