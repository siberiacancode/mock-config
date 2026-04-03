import { describe, expect, it, vi } from 'vitest';

import { rest } from './rest';

describe('rest', () => {
  it('Should build config for inline primitive response', () => {
    const result = rest.get('/users', 'value');

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: 'value',
          settings: {}
        }
      ]
    });
  });

  it('Should build config for response object with match', () => {
    const result = rest.get('/users', {
      response: { ok: true },
      match: {
        headers: {
          key: 'value'
        }
      }
    });

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: { ok: true },
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: {}
        }
      ]
    });
  });

  it('Should build config for file object with match', () => {
    const result = rest.get('/users', {
      file: '/tmp/user.json',
      match: {
        headers: {
          key: 'value'
        }
      }
    });

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: expect.any(Function),
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: {}
        }
      ]
    });
  });

  it('Should build config for inline handler', () => {
    const handler = vi.fn();
    const result = rest.get('/users', handler);

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: handler,
          settings: {}
        }
      ]
    });
  });

  it('Should build config for handler object with match', () => {
    const handler = vi.fn();
    const result = rest.get('/users', {
      handler,
      match: {
        headers: {
          key: 'value'
        }
      }
    });

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: handler,
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: {}
        }
      ]
    });
  });

  it('Should build config for queue object as data handler', async () => {
    const queueHandler = vi.fn();
    const result = rest.get('/users', {
      match: {
        headers: {
          key: 'value'
        }
      },
      queue: [
        { handler: queueHandler, time: 100 },
        { response: { ok: 'response' }, time: 200 },
        { file: '/tmp/user.json', time: 300 }
      ]
    });

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: expect.any(Function),
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: {}
        }
      ]
    });
  });

  it('Should build request config for every rest method', () => {
    const methods = ['delete', 'get', 'options', 'patch', 'post', 'put'] as const;

    methods.forEach((method) => {
      const result = rest[method]('/users', { ok: true } as any);

      expect(result).toStrictEqual({
        method,
        path: '/users',
        routes: [
          {
            data: { ok: true },
            settings: {}
          }
        ]
      });
    });
  });

  it('Should keep provided settings for request', () => {
    const result = rest.get('/users', { response: { ok: true } }, { delay: 150, status: 200 });

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: { ok: true },
          entities: undefined,
          settings: { delay: 150, status: 200 }
        }
      ]
    });
  });

  it('Should build config for SSE request', () => {
    const result = rest.sse('/users/stream', () => undefined);

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users/stream',
      routes: [
        {
          data: expect.any(Function),
          settings: { polling: false }
        }
      ]
    });
  });

  it('Should build config for stream request', () => {
    const result = rest.stream('/users/stream', () => undefined);

    expect(result).toStrictEqual({
      method: 'post',
      path: '/users/stream',
      routes: [
        {
          data: expect.any(Function),
          settings: { polling: false }
        }
      ]
    });
  });

  it('Should send SSE payload and close stream client', async () => {
    const result = rest.sse('/users/stream', ({ client }) => {
      client.send('hello');
      client.close();
    });

    const [route] = result.routes as [{ data: (params: any) => unknown }];
    const routeData = route.data;
    const setHeader = vi.fn();
    const write = vi.fn();
    const end = vi.fn();

    await routeData({
      setHeader,
      response: { write, end }
    });

    expect(setHeader).toHaveBeenCalledTimes(3);
    expect(setHeader).toHaveBeenNthCalledWith(1, 'connection', 'keep-alive');
    expect(setHeader).toHaveBeenNthCalledWith(2, 'content-type', 'text/event-stream');
    expect(setHeader).toHaveBeenNthCalledWith(3, 'cache-control', 'no-cache');
    expect(write).toHaveBeenCalledWith('data: hello\n\n');
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('Should send SSE payload with meta fields', async () => {
    const result = rest.sse('/users/stream', ({ client }) => {
      client.send('msg', {
        id: 'id-1',
        event: 'user.created',
        retry: 1500
      });
      client.close();
    });

    const [route] = result.routes as [{ data: (params: any) => unknown }];
    const routeData = route.data;
    const setHeader = vi.fn();
    const write = vi.fn();
    const end = vi.fn();

    await routeData({
      setHeader,
      response: { write, end }
    });

    expect(write).toHaveBeenCalledWith('id: id-1\nevent: user.created\nretry: 1500\ndata: msg\n\n');
  });

  it('Should type handler params with all typed fields', () => {
    const result = rest.post<{
      query: { query: string };
      body: { body: string };
      params: { params: string };
      response: { response: string };
    }>('/users/:id', () => ({ response: 'value' }));

    expect(result).toStrictEqual({
      method: 'post',
      path: '/users/:id',
      routes: [
        {
          data: expect.any(Function),
          settings: {}
        }
      ]
    });
  });
});
