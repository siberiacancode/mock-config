import type { WebSocket } from 'ws';

import { describe, expect, it, vi } from 'vitest';

import type { WsFrame } from '@/utils/types';

import { graphql, ws } from '@/core/interceptors';

import { callWsRequestInterceptors } from './callWsRequestInterceptors';

const socket = {} as WebSocket;
const broadcast = vi.fn();
const send = vi.fn();

const frame: WsFrame = {
  data: { type: 'ping' },
  isBinary: false,
  raw: '{"type":"ping"}'
};

describe('callWsRequestInterceptors: order of calls', () => {
  it('Should call passed interceptors in order', async () => {
    const firstInterceptor = vi.fn();
    const secondInterceptor = vi.fn();

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'open' },
      interceptors: [ws.request.all(firstInterceptor), ws.request.open(secondInterceptor)],
      socket,
      broadcast,
      send
    });

    expect(firstInterceptor).toBeCalledTimes(1);
    expect(secondInterceptor).toBeCalledTimes(1);
    expect(firstInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      secondInterceptor.mock.invocationCallOrder[0]
    );
  });
});

describe('callWsRequestInterceptors: interceptors filtering', () => {
  it('Should call only interceptors matched by event', async () => {
    const allInterceptor = vi.fn();
    const openInterceptor = vi.fn();
    const closeInterceptor = vi.fn();

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'open' },
      interceptors: [
        ws.request.all(allInterceptor),
        ws.request.open(openInterceptor),
        ws.request.close(closeInterceptor)
      ],
      socket,
      broadcast,
      send
    });

    expect(allInterceptor).toBeCalledTimes(1);
    expect(openInterceptor).toBeCalledTimes(1);
    expect(closeInterceptor).toBeCalledTimes(0);
  });

  it('Should call graphql subscription interceptors for graphql-ws message', async () => {
    const messageInterceptor = vi.fn();
    const subscriptionInterceptor = vi.fn();

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'message', messageType: 'graphql-ws' },
      interceptors: [
        ws.request.message(messageInterceptor),
        graphql.request.subscription(subscriptionInterceptor)
      ],
      socket,
      broadcast,
      send
    });

    expect(messageInterceptor).toBeCalledTimes(1);
    expect(subscriptionInterceptor).toBeCalledTimes(1);
  });

  it('Should not call graphql subscription interceptors for raw message', async () => {
    const subscriptionInterceptor = vi.fn();

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'message', messageType: 'raw' },
      interceptors: [graphql.request.subscription(subscriptionInterceptor)],
      socket,
      broadcast,
      send
    });

    expect(subscriptionInterceptor).toBeCalledTimes(0);
  });

  it('Should not call response interceptors', async () => {
    const responseInterceptor = vi.fn();

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'open' },
      interceptors: [ws.response.open(responseInterceptor)],
      socket,
      broadcast,
      send
    });

    expect(responseInterceptor).toBeCalledTimes(0);
  });
});

describe('callWsRequestInterceptors: params functions', () => {
  it('Should correctly provide frame for message event', async () => {
    const interceptor = vi.fn();

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'message', messageType: 'raw' },
      frame,
      interceptors: [ws.request.message(interceptor)],
      socket,
      broadcast,
      send
    });

    expect(interceptor.mock.calls[0][0].frame).toStrictEqual(frame);
  });

  it('Should correctly provide code and reason for close event', async () => {
    const interceptor = vi.fn();

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'close' },
      code: 1000,
      reason: 'normal closure',
      interceptors: [ws.request.close(interceptor)],
      socket,
      broadcast,
      send
    });

    expect(interceptor.mock.calls[0][0]).toMatchObject({
      code: 1000,
      reason: 'normal closure'
    });
  });

  it('Should correctly provide error for error event', async () => {
    const interceptor = vi.fn();
    const error = new Error('boom');

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'error' },
      error,
      interceptors: [ws.request.error(interceptor)],
      socket,
      broadcast,
      send
    });

    expect(interceptor.mock.calls[0][0].error).toBe(error);
  });

  it('Should not provide frame, code and reason for open event', async () => {
    const interceptor = vi.fn();

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'open' },
      interceptors: [ws.request.open(interceptor)],
      socket,
      broadcast,
      send
    });

    const params = interceptor.mock.calls[0][0];
    expect(params.frame).toBeUndefined();
    expect(params.code).toBeUndefined();
    expect(params.reason).toBeUndefined();
  });

  it('Should correctly provide socket, send, broadcast and setDelay', async () => {
    const interceptor = vi.fn();

    await callWsRequestInterceptors({
      meta: { type: 'ws', event: 'open' },
      interceptors: [ws.request.open(interceptor)],
      socket,
      broadcast,
      send
    });

    const params = interceptor.mock.calls[0][0];
    expect(params.socket).toBe(socket);
    expect(params.send).toBe(send);
    expect(params.broadcast).toBe(broadcast);
    expect(typeof params.setDelay).toBe('function');
  });
});
