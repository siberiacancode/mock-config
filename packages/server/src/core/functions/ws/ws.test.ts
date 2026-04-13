import { describe, expect, it, vi } from 'vitest';

import { ws } from './ws';

describe('ws', () => {
  it('Should build config for ws.message handler', () => {
    const handler = vi.fn();
    const result = ws.message(handler);

    expect(result).toStrictEqual({
      type: 'raw',
      routes: [
        {
          data: handler
        }
      ]
    });
  });

  it('Should build config for ws.connection handler', () => {
    const handler = vi.fn();
    const result = ws.connection(handler);

    expect(result).toStrictEqual({
      type: 'connection',
      routes: [{ data: handler }]
    });
  });

  it('Should build config for ws.connection handler object with match', () => {
    const handler = vi.fn();
    const result = ws.connection({
      handler,
      match: {
        headers: {
          key: 'value'
        }
      }
    });

    expect(result).toStrictEqual({
      type: 'connection',
      routes: [
        {
          data: handler,
          entities: {
            headers: {
              key: 'value'
            }
          }
        }
      ]
    });
  });
});
