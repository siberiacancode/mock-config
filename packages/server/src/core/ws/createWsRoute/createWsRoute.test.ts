import type { Buffer } from 'node:buffer';
import type { RawData } from 'ws';

import { once } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocket } from 'ws';

import type { MockServerConfig, RestParams } from '@/utils/types';

import { createMockServer } from '@/server';

const openSocket = async (url: string) => {
  const socket = new WebSocket(url);
  await once(socket, 'open');
  return socket;
};

const collectMessages = async (socket: WebSocket, count: number) =>
  await new Promise<string[]>((resolve) => {
    const messages: string[] = [];
    const handler = (data: RawData) => {
      messages.push(data.toString());
      if (messages.length >= count) {
        socket.off('message', handler);
        resolve(messages);
      }
    };
    socket.on('message', handler);
  });

describe('createWsRoute', () => {
  const closeTargets: Array<{ close: () => void }> = [];

  afterEach(async () => {
    closeTargets.splice(0, closeTargets.length).forEach((target) => target.close());
    await new Promise((resolve) => setTimeout(resolve, 25));
  });

  it('Should call connection handler on websocket connection', async () => {
    const connectionHandler = vi.fn();
    const server = createMockServer([
      {
        baseUrl: '/ws',
        configs: [
          {
            type: 'connection',
            routes: [{ data: connectionHandler }]
          }
        ]
      }
    ] as MockServerConfig).listen(0);

    closeTargets.push(server);
    await once(server, 'listening');

    const { port } = server.address() as { port: number };
    const socket = await openSocket(`ws://127.0.0.1:${port}/ws?room=lobby`);
    closeTargets.push(socket);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(connectionHandler).toBeCalledTimes(1);
    expect(connectionHandler.mock.calls[0]?.[0].request.url).toBe('/ws?room=lobby');
  });

  it('Should match ws.connection by baseUrl and request url', async () => {
    const firstConnectionHandler = vi.fn();
    const secondConnectionHandler = vi.fn();
    const server = createMockServer([
      {
        baseUrl: '/first',
        configs: [
          {
            type: 'connection',
            routes: [{ data: firstConnectionHandler }]
          }
        ]
      },
      {
        baseUrl: '/second',
        configs: [
          {
            type: 'connection',
            routes: [{ data: secondConnectionHandler }]
          }
        ]
      }
    ] as MockServerConfig).listen(0);

    closeTargets.push(server);
    await once(server, 'listening');

    const { port } = server.address() as { port: number };
    const socket = await openSocket(`ws://127.0.0.1:${port}/second?user=42`);
    closeTargets.push(socket);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(firstConnectionHandler).toBeCalledTimes(0);
    expect(secondConnectionHandler).toBeCalledTimes(1);
    expect(secondConnectionHandler.mock.calls[0]?.[0].request.url).toContain('user=42');
  });

  it('Should call ws.connection route only when entities matched', async () => {
    const unmatchedHandler = vi.fn();
    const matchedHandler = vi.fn();
    const server = createMockServer([
      {
        baseUrl: '/events',
        configs: [
          {
            type: 'connection',
            routes: [
              {
                data: unmatchedHandler,
                entities: {
                  query: {
                    room: 'private'
                  }
                }
              },
              {
                data: matchedHandler,
                entities: {
                  query: {
                    room: 'public'
                  }
                }
              }
            ]
          }
        ]
      }
    ] as MockServerConfig).listen(0);

    closeTargets.push(server);
    await once(server, 'listening');

    const { port } = server.address() as { port: number };
    const socket = await openSocket(`ws://127.0.0.1:${port}/events?room=public`);
    closeTargets.push(socket);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(unmatchedHandler).toBeCalledTimes(0);
    expect(matchedHandler).toBeCalledTimes(1);
  });

  it('Should broadcast emit payload to all active clients', async () => {
    const server = createMockServer([
      {
        baseUrl: '/events',
        configs: [
          {
            type: 'connection',
            routes: [{ data: () => undefined }]
          },
          {
            method: 'post',
            path: '/publish',
            routes: [
              {
                data: ({ emit }: RestParams<'post'>) => {
                  emit({ type: 'news' });
                  return { ok: true };
                }
              }
            ]
          }
        ]
      }
    ] as MockServerConfig).listen(0);

    closeTargets.push(server);
    await once(server, 'listening');

    const { port } = server.address() as { port: number };
    const firstSocket = await openSocket(`ws://127.0.0.1:${port}/events`);
    const secondSocket = await openSocket(`ws://127.0.0.1:${port}/events`);
    closeTargets.push(firstSocket);
    closeTargets.push(secondSocket);

    const firstMessagePromise = once(firstSocket, 'message');
    const secondMessagePromise = once(secondSocket, 'message');

    const response = await fetch(`http://127.0.0.1:${port}/events/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(response.status).toBe(200);

    const [firstMessage] = (await firstMessagePromise) as [Buffer];
    const [secondMessage] = (await secondMessagePromise) as [Buffer];

    expect(firstMessage.toString()).toBe(JSON.stringify({ type: 'news' }));
    expect(secondMessage.toString()).toBe(JSON.stringify({ type: 'news' }));
  });

  it('Should execute two matched connection artifacts', async () => {
    const firstConnectionHandler = vi.fn(() => ({ source: 'first' }));
    const secondConnectionHandler = vi.fn(() => ({ source: 'second' }));
    const server = createMockServer([
      {
        baseUrl: '/events',
        configs: [
          {
            type: 'connection',
            routes: [{ data: firstConnectionHandler }]
          },
          {
            type: 'connection',
            routes: [{ data: secondConnectionHandler }]
          }
        ]
      }
    ] as MockServerConfig).listen(0);

    closeTargets.push(server);
    await once(server, 'listening');

    const { port } = server.address() as { port: number };
    const socket = await openSocket(`ws://127.0.0.1:${port}/events`);
    closeTargets.push(socket);

    const messagesPromise = collectMessages(socket, 2);
    const messages = await messagesPromise;

    expect(firstConnectionHandler).toBeCalledTimes(1);
    expect(secondConnectionHandler).toBeCalledTimes(1);
    expect(messages).toEqual([
      JSON.stringify({ source: 'first' }),
      JSON.stringify({ source: 'second' })
    ]);
  });

  it('Should execute two matched raw artifacts', async () => {
    const firstMessageHandler = vi.fn(({ raw }) => ({ source: 'first', raw }));
    const secondMessageHandler = vi.fn(({ raw }) => ({ source: 'second', raw }));
    const server = createMockServer([
      {
        baseUrl: '/chat',
        configs: [
          {
            type: 'raw',
            routes: [{ data: firstMessageHandler }]
          },
          {
            type: 'raw',
            routes: [{ data: secondMessageHandler }]
          }
        ]
      }
    ] as MockServerConfig).listen(0);

    closeTargets.push(server);
    await once(server, 'listening');

    const { port } = server.address() as { port: number };
    const socket = await openSocket(`ws://127.0.0.1:${port}/chat`);
    closeTargets.push(socket);

    const messagesPromise = collectMessages(socket, 2);
    socket.send('hello');
    const messages = await messagesPromise;

    expect(firstMessageHandler).toBeCalledTimes(1);
    expect(secondMessageHandler).toBeCalledTimes(1);
    expect(messages).toEqual([
      JSON.stringify({ source: 'first', raw: 'hello' }),
      JSON.stringify({ source: 'second', raw: 'hello' })
    ]);
  });
});
