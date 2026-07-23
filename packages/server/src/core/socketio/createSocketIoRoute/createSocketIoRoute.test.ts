import { describe, expect, it, vi } from 'vitest';

import { createSocketIoRoute } from './createSocketIoRoute';

const createMockIo = () => {
  const nspHandlers: Record<string, (socket: any) => void> = {};

  const io = {
    of: vi.fn((namespace: string) => ({
      on: vi.fn((_event: 'connection', handler: (socket: any) => void) => {
        nspHandlers[namespace] = handler;
      })
    })),
    emit: vi.fn()
  } as any;

  const triggerConnection = async (namespace: string, socket: any) => {
    const handler = nspHandlers[namespace];
    if (!handler) throw new Error(`No connection handler registered for namespace: ${namespace}`);
    handler(socket);
  };

  return { io, triggerConnection };
};

describe('createSocketIoRoute: connection', () => {
  it('Should match connection route by entities and send resolved data', async () => {
    const { io, triggerConnection } = createMockIo();

    const socket = {
      request: {
        headers: {
          'x-key': 'value',
          cookie: 'a=1'
        },
        queries: undefined,
        cookies: undefined
      },
      handshake: {
        url: '/?room=public'
      },
      send: vi.fn(),
      on: vi.fn(),
      emit: vi.fn()
    };

    createSocketIoRoute({
      io,
      socketIoRequestArtifacts: [
        {
          baseUrl: '/',
          type: 'connection',
          config: {
            entities: {
              headers: { 'x-key': 'value' }
            },
            data: vi.fn(async () => ({ ok: true }))
          }
        } as any
      ]
    });

    await triggerConnection('/', socket);

    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ ok: true }));

    expect(socket.request.queries).toStrictEqual({ room: 'public' });
    expect(socket.request.cookies).toStrictEqual({ a: '1' });
  });

  it('Should NOT send connection route data when entities do not match', async () => {
    const { io, triggerConnection } = createMockIo();

    const socket = {
      request: {
        headers: {
          'x-key': 'wrong',
          cookie: 'a=1'
        },
        queries: undefined,
        cookies: undefined
      },
      handshake: {
        url: '/?room=public'
      },
      send: vi.fn()
    };

    createSocketIoRoute({
      io,
      socketIoRequestArtifacts: [
        {
          baseUrl: '/',
          type: 'connection',
          config: {
            entities: {
              headers: { 'x-key': 'value' }
            },
            data: vi.fn(async () => ({ ok: true }))
          }
        } as any
      ]
    });

    await triggerConnection('/', socket);

    expect(socket.send).not.toHaveBeenCalled();
  });

  it('Should broadcast data via io.emit when broadcast() is called in connection handler', async () => {
    const { io, triggerConnection } = createMockIo();

    const socket = {
      request: {
        headers: {
          cookie: 'a=1'
        }
      },
      handshake: {
        url: '/'
      },
      send: vi.fn()
    };

    createSocketIoRoute({
      io,
      socketIoRequestArtifacts: [
        {
          baseUrl: '/',
          type: 'connection',
          config: {
            data: vi.fn(async ({ broadcast }: any) => {
              broadcast({ msg: 'broadcasted' });
              return { ok: true };
            })
          }
        } as any
      ]
    });

    await triggerConnection('/', socket);

    expect(io.emit).toHaveBeenCalledTimes(1);
    expect(io.emit).toHaveBeenCalledWith('message', { msg: 'broadcasted' });
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
  });
});

describe('createSocketIoRoute: message', () => {
  it('Should route raw socket.io messages by event and call response interceptor after data resolves', async () => {
    const { io, triggerConnection } = createMockIo();

    const componentRequestInterceptor = vi.fn(async () => undefined);
    const componentResponseInterceptor = vi.fn(async (data) => ({ ...data, intercepted: true }));

    const socketOn = vi.fn((event: string, handler: any) => {
      if (event !== 'user.created') return;
      const receivedArgs = ['hello'];
      return handler(...receivedArgs);
    });

    const socket = {
      request: {
        headers: {
          cookie: 'a=1'
        }
      },
      handshake: {
        url: '/?room=public'
      },
      send: vi.fn(),
      emit: vi.fn(),
      on: socketOn
    };

    createSocketIoRoute({
      io,
      socketIoRequestArtifacts: [
        {
          baseUrl: '/',
          type: 'message',
          config: {
            event: 'user.created',
            data: vi.fn(async ({ args }: any) => ({ payload: args[0] }))
          },
          componentRequestInterceptor,
          componentResponseInterceptor
        } as any
      ]
    });

    await triggerConnection('/', socket);

    await Promise.resolve();

    expect(componentRequestInterceptor).toHaveBeenCalledTimes(1);
    expect(componentResponseInterceptor).toHaveBeenCalledTimes(1);
  });

  it('Should delay raw message response by settings.delay', async () => {
    const { io, triggerConnection } = createMockIo();
    vi.useFakeTimers();

    const socketOn = vi.fn((_, handler: any) => {
      void handler('hello');
    });

    const socket = {
      request: {
        headers: {
          cookie: 'a=1'
        }
      },
      handshake: {
        url: '/?room=public'
      },
      send: vi.fn(),
      emit: vi.fn(),
      on: socketOn
    };

    const delay = 100;
    createSocketIoRoute({
      io,
      socketIoRequestArtifacts: [
        {
          baseUrl: '/',
          type: 'message',
          config: {
            event: 'user.created',
            settings: { delay },
            data: vi.fn(async () => ({ ok: true }))
          }
        } as any
      ]
    });

    await triggerConnection('/', socket);

    vi.advanceTimersByTime(delay);
    await Promise.resolve();

    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ ok: true }));

    vi.useRealTimers();
  });

  it('Should support sending undefined without socket.send', async () => {
    const { io, triggerConnection } = createMockIo();

    const socketOn = vi.fn((_, handler: any) => {
      void handler('hello');
    });

    const socket = {
      request: {
        headers: {
          cookie: 'a=1'
        }
      },
      handshake: {
        url: '/?room=public'
      },
      send: vi.fn(),
      emit: vi.fn(),
      on: socketOn
    };

    createSocketIoRoute({
      io,
      socketIoRequestArtifacts: [
        {
          baseUrl: '/',
          type: 'message',
          config: {
            event: 'user.created',
            data: vi.fn(async () => undefined)
          }
        } as any
      ]
    });

    await triggerConnection('/', socket);

    expect(socket.send).not.toHaveBeenCalled();
  });

  it('Should broadcast data via io.emit when broadcast() is called in message handler', async () => {
    const { io, triggerConnection } = createMockIo();

    const socketOn = vi.fn((_, handler: any) => {
      void handler('hello');
    });

    const socket = {
      request: {
        headers: {
          cookie: 'a=1'
        }
      },
      handshake: {
        url: '/?room=public'
      },
      send: vi.fn(),
      emit: vi.fn(),
      on: socketOn
    };

    createSocketIoRoute({
      io,
      socketIoRequestArtifacts: [
        {
          baseUrl: '/',
          type: 'message',
          config: {
            event: 'user.created',
            data: vi.fn(async ({ broadcast }: any) => {
              broadcast({ broadcasted: true });
              return { ok: true };
            })
          }
        } as any
      ]
    });

    await triggerConnection('/', socket);

    expect(io.emit).toHaveBeenCalledTimes(1);
    expect(io.emit).toHaveBeenCalledWith('message', { broadcasted: true });
  });

  it('Should emit custom event with data when emit() is called in message handler', async () => {
    const { io, triggerConnection } = createMockIo();

    const socketOn = vi.fn((_, handler: any) => {
      void handler('hello');
    });

    const socket = {
      request: {
        headers: {
          cookie: 'a=1'
        }
      },
      handshake: {
        url: '/?room=public'
      },
      send: vi.fn(),
      emit: vi.fn(),
      on: socketOn
    };

    createSocketIoRoute({
      io,
      socketIoRequestArtifacts: [
        {
          baseUrl: '/',
          type: 'message',
          config: {
            event: 'user.created',
            data: vi.fn(async ({ emit }: any) => {
              emit('custom-event', { custom: true });
              return { ok: true };
            })
          }
        } as any
      ]
    });

    await triggerConnection('/', socket);

    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith('custom-event', { custom: true });
  });

  it('Should call both broadcast and emit independently in message handler', async () => {
    const { io, triggerConnection } = createMockIo();

    const socketOn = vi.fn((_, handler: any) => {
      void handler('hello');
    });

    const socket = {
      request: {
        headers: {
          cookie: 'a=1'
        }
      },
      handshake: {
        url: '/?room=public'
      },
      send: vi.fn(),
      emit: vi.fn(),
      on: socketOn
    };

    createSocketIoRoute({
      io,
      socketIoRequestArtifacts: [
        {
          baseUrl: '/',
          type: 'message',
          config: {
            event: 'user.created',
            data: vi.fn(async ({ broadcast, emit: emitFn }: any) => {
              broadcast({ broadcasted: true });
              emitFn('custom-event', { custom: true });
              return { ok: true };
            })
          }
        } as any
      ]
    });

    await triggerConnection('/', socket);

    expect(io.emit).toHaveBeenCalledTimes(1);
    expect(io.emit).toHaveBeenCalledWith('message', { broadcasted: true });
    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith('custom-event', { custom: true });
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
  });
});
