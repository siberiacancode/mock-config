import { describe, expect, it, vi } from 'vitest';

import type { WsFrame, WsSocket } from '@/utils/types';

import { graphql, ws } from '@/core/interceptors';

import { callWsResponseInterceptors } from './callWsResponseInterceptors';

const socket = {} as WsSocket;
const wsEventContext = { id: 1, timestamp: Date.now() };
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
      await callWsResponseInterceptors(
        {
          event: wsEventContext,
          data: '',
          meta: { type: 'ws', event: 'open' },
          socket,
          broadcast,
          send
        },
        {}
      )
    ).toBe('');
    expect(componentInterceptor).toBeCalledTimes(0);
    expect(serverInterceptor).toBeCalledTimes(0);

    expect(
      await callWsResponseInterceptors(
        {
          event: wsEventContext,
          data: '',
          meta: { type: 'ws', event: 'open' },
          socket,
          broadcast,
          send
        },
        {
          componentInterceptors: [ws.response.open(componentInterceptor)],
          serverInterceptors: [ws.response.open(serverInterceptor)]
        }
      )
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

    await callWsResponseInterceptors(
      {
        event: wsEventContext,
        data: { key: 'value' },
        meta: { type: 'ws', event: 'close' },
        socket,
        broadcast,
        send
      },
      {
        componentInterceptors: [
          ws.response.all(allInterceptor),
          ws.response.close(closeInterceptor),
          ws.response.open(openInterceptor)
        ]
      }
    );

    expect(allInterceptor).toBeCalledTimes(1);
    expect(closeInterceptor).toBeCalledTimes(1);
    expect(openInterceptor).toBeCalledTimes(0);
  });

  it('Should call graphql subscription interceptors for graphql-ws message', async () => {
    const subscriptionInterceptor = vi.fn((data) => data);

    await callWsResponseInterceptors(
      {
        event: wsEventContext,
        data: { key: 'value' },
        meta: { type: 'ws', event: 'message', messageType: 'graphql-ws' },
        socket,
        broadcast,
        send
      },
      { componentInterceptors: [graphql.response.subscription(subscriptionInterceptor)] }
    );

    expect(subscriptionInterceptor).toBeCalledTimes(1);
  });
});

describe('callWsResponseInterceptors: params functions', () => {
  it('Should correctly provide params for message event', async () => {
    const interceptor = vi.fn((data) => data);

    await callWsResponseInterceptors(
      {
        event: wsEventContext,
        data: { key: 'value' },
        meta: { type: 'ws', event: 'message', messageType: 'raw' },
        frame,
        socket,
        broadcast,
        send
      },
      { componentInterceptors: [ws.response.message(interceptor)] }
    );

    expect(interceptor).toHaveBeenCalledWith({ key: 'value' }, expect.objectContaining({ frame }));
  });

  it('Should correctly provide params for close event', async () => {
    const interceptor = vi.fn((data) => data);

    await callWsResponseInterceptors(
      {
        event: wsEventContext,
        data: { key: 'value' },
        meta: { type: 'ws', event: 'close' },
        code: 1000,
        reason: 'normal closure',
        socket,
        broadcast,
        send
      },
      { componentInterceptors: [ws.response.close(interceptor)] }
    );

    expect(interceptor).toHaveBeenCalledWith(
      { key: 'value' },
      expect.objectContaining({ code: 1000, reason: 'normal closure' })
    );
  });

  it('Should correctly provide params', async () => {
    const interceptor = vi.fn((data) => data);

    await callWsResponseInterceptors(
      {
        event: wsEventContext,
        data: { key: 'value' },
        meta: { type: 'ws', event: 'open' },
        socket,
        broadcast,
        send
      },
      { componentInterceptors: [ws.response.open(interceptor)] }
    );

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
