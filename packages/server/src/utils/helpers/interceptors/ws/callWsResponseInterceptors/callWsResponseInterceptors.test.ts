import type { WebSocket } from 'ws';

import { describe, expect, it, vi } from 'vitest';

import type { WsFrame } from '@/utils/types';

import { graphql, ws } from '@/core/interceptors';

import { callWsResponseInterceptors } from './callWsResponseInterceptors';

const socket = {} as WebSocket;
const broadcast = vi.fn();
const send = vi.fn();

const frame: WsFrame = {
  data: { type: 'ping' },
  isBinary: false,
  raw: '{"type":"ping"}'
};

describe('callWsResponseInterceptors: order of calls', () => {
  it('Should call all passed response interceptors in order: component -> server', async () => {
    const componentInterceptor = vi.fn((data) => `${data}componentInterceptor;`);
    const serverInterceptor = vi.fn((data) => `${data}serverInterceptor`);

    expect(
      await callWsResponseInterceptors({
        data: '',
        meta: { type: 'ws', event: 'open' },
        socket,
        broadcast,
        send
      })
    ).toBe('');
    expect(componentInterceptor).toBeCalledTimes(0);
    expect(serverInterceptor).toBeCalledTimes(0);

    expect(
      await callWsResponseInterceptors({
        data: '',
        meta: { type: 'ws', event: 'open' },
        componentInterceptors: [ws.response.open(componentInterceptor)],
        serverInterceptors: [ws.response.open(serverInterceptor)],
        socket,
        broadcast,
        send
      })
    ).toBe('componentInterceptor;serverInterceptor');
    expect(componentInterceptor).toBeCalledTimes(1);
    expect(serverInterceptor).toBeCalledTimes(1);
    expect(componentInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      serverInterceptor.mock.invocationCallOrder[0]
    );
  });
});

describe('callWsResponseInterceptors: interceptors filtering', () => {
  it('Should call only interceptors matched by event', async () => {
    const allInterceptor = vi.fn((data) => data);
    const closeInterceptor = vi.fn((data) => data);
    const openInterceptor = vi.fn((data) => data);

    await callWsResponseInterceptors({
      data: { key: 'value' },
      meta: { type: 'ws', event: 'close' },
      componentInterceptors: [
        ws.response.all(allInterceptor),
        ws.response.close(closeInterceptor),
        ws.response.open(openInterceptor)
      ],
      socket,
      broadcast,
      send
    });

    expect(allInterceptor).toBeCalledTimes(1);
    expect(closeInterceptor).toBeCalledTimes(1);
    expect(openInterceptor).toBeCalledTimes(0);
  });

  it('Should call graphql subscription interceptors for graphql-ws message', async () => {
    const subscriptionInterceptor = vi.fn((data) => data);

    await callWsResponseInterceptors({
      data: { key: 'value' },
      meta: { type: 'ws', event: 'message', messageType: 'graphql-ws' },
      componentInterceptors: [graphql.response.subscription(subscriptionInterceptor)],
      socket,
      broadcast,
      send
    });

    expect(subscriptionInterceptor).toBeCalledTimes(1);
  });
});

describe('callWsResponseInterceptors: params functions', () => {
  it('Should correctly provide frame for message event', async () => {
    const interceptor = vi.fn((data) => data);

    await callWsResponseInterceptors({
      data: { key: 'value' },
      meta: { type: 'ws', event: 'message', messageType: 'raw' },
      frame,
      componentInterceptors: [ws.response.message(interceptor)],
      socket,
      broadcast,
      send
    });

    expect(interceptor).toHaveBeenCalledWith({ key: 'value' }, expect.objectContaining({ frame }));
  });

  it('Should correctly provide code and reason for close event', async () => {
    const interceptor = vi.fn((data) => data);

    await callWsResponseInterceptors({
      data: { key: 'value' },
      meta: { type: 'ws', event: 'close' },
      code: 1000,
      reason: 'normal closure',
      componentInterceptors: [ws.response.close(interceptor)],
      socket,
      broadcast,
      send
    });

    expect(interceptor).toHaveBeenCalledWith(
      { key: 'value' },
      expect.objectContaining({ code: 1000, reason: 'normal closure' })
    );
  });

  it('Should correctly provide socket, send, broadcast and setDelay', async () => {
    const interceptor = vi.fn((data) => data);

    await callWsResponseInterceptors({
      data: { key: 'value' },
      meta: { type: 'ws', event: 'open' },
      componentInterceptors: [ws.response.open(interceptor)],
      socket,
      broadcast,
      send
    });

    expect(interceptor).toHaveBeenCalledWith(
      { key: 'value' },
      expect.objectContaining({
        socket,
        send,
        broadcast,
        setDelay: expect.any(Function)
      })
    );
  });
});
