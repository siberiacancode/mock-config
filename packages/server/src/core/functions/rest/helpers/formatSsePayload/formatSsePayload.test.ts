import { describe, expect, it } from 'vitest';

import { formatSsePayload } from './formatSsePayload';

describe('formatSsePayload', () => {
  it('Should format payload without meta', () => {
    const payload = formatSsePayload('hello');

    expect(payload).toBe('data: hello\n\n');
  });

  it('Should include normalized meta fields before data', () => {
    const payload = formatSsePayload('message', {
      id: 'id\r\n123',
      event: 'user\ncreated\r',
      retry: 1500
    });

    expect(payload).toBe('id: id123\nevent: usercreated\nretry: 1500\ndata: message\n\n');
  });

  it('Should split multiline payload into multiple data lines', () => {
    const payload = formatSsePayload('line1\r\nline2\nline3\rline4');

    expect(payload).toBe('data: line1\ndata: line2\ndata: line3\ndata: line4\n\n');
  });

  it('Should throw if meta is invalid', () => {
    expect(() => formatSsePayload('message', { retry: -1 })).toThrow(
      'Invalid SSE meta: Number must be greater than or equal to 0'
    );
  });
});
