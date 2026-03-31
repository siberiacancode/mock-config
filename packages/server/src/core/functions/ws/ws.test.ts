import { describe, expect, it, vi } from 'vitest';

import { WS_MESSAGE_EVENT } from '@/utils/types';

import { ws } from './ws';

describe('ws', () => {
  it('Should build config for ws.event inline response', () => {
    const result = ws.event('user.created', { ok: true });

    expect(result).toStrictEqual({
      event: 'user.created',
      routes: [
        {
          data: { ok: true }
        }
      ]
    });
  });

  it('Should build config for ws.message sugar handler', () => {
    const handler = vi.fn();
    const result = ws.message(handler);

    expect(result).toStrictEqual({
      event: WS_MESSAGE_EVENT,
      routes: [
        {
          data: handler
        }
      ]
    });
  });
});
