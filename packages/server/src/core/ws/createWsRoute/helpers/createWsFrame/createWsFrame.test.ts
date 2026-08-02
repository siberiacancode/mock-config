import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';

import { createWsFrame } from './createWsFrame';

describe('createWsFrame', () => {
  it('Should keep text frame as string', () => {
    expect(createWsFrame(Buffer.from('ping'), false)).toStrictEqual({
      data: 'ping',
      isBinary: false,
      raw: 'ping'
    });
  });

  it('Should parse json text frame into data', () => {
    expect(createWsFrame(Buffer.from('{"type":"ping"}'), false)).toStrictEqual({
      data: { type: 'ping' },
      isBinary: false,
      raw: '{"type":"ping"}'
    });
  });

  it('Should keep binary frame as buffer', () => {
    expect(createWsFrame(Buffer.from('{"type":"ping"}'), true)).toStrictEqual({
      data: { type: 'ping' },
      isBinary: true,
      raw: Buffer.from('{"type":"ping"}')
    });
  });

  it('Should fall back to text when frame is not a json', () => {
    expect(createWsFrame(Buffer.from([0x01, 0x02]), true).data).toBe(
      Buffer.from([0x01, 0x02]).toString()
    );
  });
});
