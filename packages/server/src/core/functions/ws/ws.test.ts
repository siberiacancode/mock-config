import { describe, expect, it, vi } from 'vitest';

import { ws } from './ws';

describe('ws', () => {
  it('Should build config for inline response', () => {
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

  it('Should build config for response object with match', () => {
    const result = ws.event('user.created', {
      response: { ok: true },
      match: {
        payload: {
          room: 'users'
        }
      }
    });

    expect(result).toStrictEqual({
      event: 'user.created',
      routes: [
        {
          data: { ok: true },
          entities: {
            payload: {
              room: 'users'
            }
          }
        }
      ]
    });
  });

  it('Should build config for inline handler', () => {
    const handler = vi.fn();
    const result = ws.event('user.created', handler);

    expect(result).toStrictEqual({
      event: 'user.created',
      routes: [
        {
          data: handler
        }
      ]
    });
  });

  it('Should build config for handler object with match', () => {
    const handler = vi.fn();
    const result = ws.event('user.created', {
      handler,
      match: {
        payload: {
          room: 'users'
        }
      }
    });

    expect(result).toStrictEqual({
      event: 'user.created',
      routes: [
        {
          data: handler,
          entities: {
            payload: {
              room: 'users'
            }
          }
        }
      ]
    });
  });
});
