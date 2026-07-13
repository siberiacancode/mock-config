import { describe, expect, it, vi } from 'vitest';

import { file, polling, rest } from './rest';

describe('rest', () => {
  it('Should build config for inline primitive response', () => {
    const result = rest.get('/users', 'value');

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: 'value',
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build config for response object with match', () => {
    const result = rest.get(
      '/users',
      { ok: true },
      {
        match: {
          headers: {
            key: 'value'
          }
        }
      }
    );

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

  it('Should build config for handler', () => {
    const handler = vi.fn();
    const result = rest.get('/users', handler);

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: handler,
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build config for handler object with match', () => {
    const handler = vi.fn();
    const result = rest.get('/users', handler, {
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

  it('Should build config for polling', async () => {
    const pollingHandler = vi.fn();
    const result = rest.get(
      '/users',
      polling([
        { handler: pollingHandler, time: 100 },
        { response: { ok: 'response' }, time: 200 },
        { file: '/tmp/user.json', time: 300 }
      ]),
      {
        match: {
          headers: {
            key: 'value'
          }
        }
      }
    );

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

  it('Should build config for file', () => {
    const result = rest.get('/users', file('/tmp/user.json'));

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: expect.any(Function),
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build config for generator resolver', () => {
    const handler = function* () {
      yield { count: 1 };
      return { count: 2 };
    };
    const result = rest.get('/users', handler);

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: expect.any(Function),
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should preserve generator state between handler calls', () => {
    const result = rest.get('/users', function* () {
      yield { count: 1 };
      return { count: 2 };
    });

    const [route] = result.routes as [{ data: (params: any) => unknown }];
    const firstResponse = route.data({});
    const secondResponse = route.data({});
    const thirdResponse = route.data({});

    expect(firstResponse).toStrictEqual({ count: 1 });
    expect(secondResponse).toStrictEqual({ count: 2 });
    expect(thirdResponse).toStrictEqual({ count: 1 });
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
            entities: {},
            settings: {}
          }
        ]
      });
    });
  });

  it('Should keep provided settings for request', () => {
    const result = rest.get('/users', { ok: true }, { delay: 150, status: 200 });

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: { ok: true },
          entities: {},
          settings: { delay: 150, status: 200 }
        }
      ]
    });
  });

  it('Should use match from settings', () => {
    const result = rest.get(
      '/users',
      { ok: true },
      {
        delay: 150,
        match: {
          headers: {
            key: 'value'
          }
        },
        status: 200
      }
    );

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
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build config for SSE request with match', () => {
    const handler = vi.fn();
    const result = rest.sse('/users/stream', handler, {
      match: {
        headers: {
          key: 'value'
        }
      }
    });

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users/stream',
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

  it('Should build config for stream request', () => {
    const result = rest.stream('/users/stream', () => undefined);

    expect(result).toStrictEqual({
      method: 'post',
      path: '/users/stream',
      routes: [
        {
          data: expect.any(Function),
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build config for stream request with match', () => {
    const handler = vi.fn();
    const result = rest.stream('/users/stream', handler, {
      match: {
        headers: {
          key: 'value'
        }
      }
    });

    expect(result).toStrictEqual({
      method: 'post',
      path: '/users/stream',
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
          entities: {},
          settings: {}
        }
      ]
    });
  });
});
