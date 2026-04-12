import { describe, expect, it, vi } from 'vitest';

import { ws } from './ws';

describe('ws', () => {
  it('Should build config for ws.message handler', () => {
    const handler = vi.fn();
    const result = ws.message(handler);

    expect(result).toStrictEqual({
      protocol: 'raw',
      routes: [
        {
          data: handler
        }
      ]
    });
  });
});
