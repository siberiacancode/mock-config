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
          settings: { polling: false }
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
          settings: { polling: false }
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
          file: '/tmp/user.json',
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: { polling: false }
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
          settings: { polling: false }
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
          settings: { polling: false }
        }
      ]
    });
  });

  it('Should build config for queue object and normalize queue items', () => {
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
          queue: [
            { data: queueHandler, time: 100 },
            { data: { ok: 'response' }, time: 200 },
            { file: '/tmp/user.json', time: 300 }
          ],
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: { polling: true }
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
            settings: { polling: false }
          }
        ]
      });
    });
  });

  it('Should keep provided settings for request', () => {
    const result = rest.get(
      '/users',
      { response: { ok: true } },
      { delay: 150, polling: false, status: 200 }
    );

    expect(result).toStrictEqual({
      method: 'get',
      path: '/users',
      routes: [
        {
          data: { ok: true },
          entities: undefined,
          settings: { delay: 150, polling: false, status: 200 }
        }
      ]
    });
  });

  it('Should type handler params with all typed fields', () => {
    const result = rest.post<{
      query: { query: string };
      body: { body: string };
      params: { params: string };
      response: { response: string };
    }>('/users/:id', (params) => {
      const query = params.request.query.query;
      const body = params.request.body.body;
      const path = params.request.params.params;
      console.log(query, body, path);

      return { response: 'value' };
    });

    expect(result).toStrictEqual({
      method: 'post',
      path: '/users/:id',
      routes: [
        {
          data: expect.any(Function),
          settings: { polling: false }
        }
      ]
    });
  });
});
