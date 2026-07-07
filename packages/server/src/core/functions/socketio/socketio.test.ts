import { describe, expect, it, vi } from 'vitest';

import { socketio } from './socketio';

describe('socketio', () => {
  it('Should build config for socketio.message handler', () => {
    const handler = vi.fn();
    const result = socketio.message('user.created', handler);

    expect(result).toStrictEqual({
      transportType: 'socket.io',
      type: 'message',
      routes: [
        {
          data: handler,
          event: 'user.created'
        }
      ]
    });
  });

  it('Should build config for socketio.message handler object with event', () => {
    const handler = vi.fn();
    const result = socketio.message({
      event: 'user.created',
      handler
    });

    expect(result).toStrictEqual({
      transportType: 'socket.io',
      type: 'message',
      routes: [
        {
          data: handler,
          event: 'user.created'
        }
      ]
    });
  });

  it('Should build config for socketio.connection handler', () => {
    const handler = vi.fn();
    const result = socketio.connection(handler);

    expect(result).toStrictEqual({
      transportType: 'socket.io',
      type: 'connection',
      routes: [
        {
          data: handler
        }
      ]
    });
  });

  it('Should build config for socketio.connection handler object with match', () => {
    const handler = vi.fn();
    const result = socketio.connection({
      handler,
      match: {
        headers: {
          key: 'value'
        }
      }
    });

    expect(result).toStrictEqual({
      transportType: 'socket.io',
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
