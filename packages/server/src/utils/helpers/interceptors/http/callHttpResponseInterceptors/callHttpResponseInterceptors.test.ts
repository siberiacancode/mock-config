import type { Request, Response } from 'express';

import { describe, expect, it, vi } from 'vitest';

import type { PlainObject } from '@/utils/types';

import { graphql, http, rest } from '@/core/interceptors';

import { callHttpResponseInterceptors } from './callHttpResponseInterceptors';

const createRequest = (value: PlainObject = {}) =>
  ({
    headers: {},
    cookies: {},
    context: { orm: {} },
    ...value
  }) as Request;

const meta = { type: 'rest', method: 'get' } as const;

describe('callHttpResponseInterceptors: order of calls', () => {
  it('Should call all passed response interceptors in order: component -> server', async () => {
    const componentInterceptor = vi.fn((data) => `${data}componentInterceptor;`);
    const serverInterceptor = vi.fn((data) => `${data}serverInterceptor`);
    const request = createRequest();
    const response = {} as Response;

    expect(
      await callHttpResponseInterceptors(
        {
          data: '',
          meta,
          request,
          response
        },
        {}
      )
    ).toBe('');
    expect(componentInterceptor).toBeCalledTimes(0);
    expect(serverInterceptor).toBeCalledTimes(0);

    expect(
      await callHttpResponseInterceptors(
        {
          data: '',
          meta,
          request,
          response
        },
        {
          componentInterceptors: [rest.response.get(componentInterceptor)],
          serverInterceptors: [rest.response.get(serverInterceptor)]
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

describe('callHttpResponseInterceptors: interceptors filtering', () => {
  it('Should call only interceptors matched by rest method', async () => {
    const allInterceptor = vi.fn((data) => data);
    const getInterceptor = vi.fn((data) => data);
    const postInterceptor = vi.fn((data) => data);

    await callHttpResponseInterceptors(
      {
        data: { key: 'value' },
        meta,
        request: createRequest(),
        response: {} as Response
      },
      {
        componentInterceptors: [
          http.response.all(allInterceptor),
          rest.response.get(getInterceptor),
          rest.response.post(postInterceptor)
        ]
      }
    );

    expect(allInterceptor).toBeCalledTimes(1);
    expect(getInterceptor).toBeCalledTimes(1);
    expect(postInterceptor).toBeCalledTimes(0);
  });

  it('Should call only interceptors matched by graphql operation type', async () => {
    const queryInterceptor = vi.fn((data) => data);
    const mutationInterceptor = vi.fn((data) => data);

    await callHttpResponseInterceptors(
      {
        data: { key: 'value' },
        meta: { type: 'graphql', operationType: 'query' },
        request: createRequest(),
        response: {} as Response
      },
      {
        componentInterceptors: [
          graphql.response.query(queryInterceptor),
          graphql.response.mutation(mutationInterceptor)
        ]
      }
    );

    expect(queryInterceptor).toBeCalledTimes(1);
    expect(mutationInterceptor).toBeCalledTimes(0);
  });
});

describe('callHttpResponseInterceptors: params functions', () => {
  const callWithInterceptor = async (
    interceptor: (data: unknown, params: any) => unknown,
    { request, response }: { request: Request; response: Response }
  ) =>
    callHttpResponseInterceptors(
      {
        data: null,
        meta,
        request,
        response
      },
      { componentInterceptors: [rest.response.get(interceptor)] }
    );

  it('Should correctly get header from request.headers', async () => {
    await callWithInterceptor(
      (data, { getRequestHeader }) => {
        expect(getRequestHeader('name')).toBe('value');
        return data;
      },
      { request: createRequest({ headers: { name: 'value' } }), response: {} as Response }
    );
  });

  it('Should correctly get headers property from request', async () => {
    const request = createRequest({ headers: { name: 'value' } });

    await callWithInterceptor(
      (data, { getRequestHeaders }) => {
        expect(getRequestHeaders()).toBe(request.headers);
        return data;
      },
      { request, response: {} as Response }
    );
  });

  it('Should correctly call response getHeader method', async () => {
    const response = { getHeader: vi.fn() } as unknown as Response;

    await callWithInterceptor(
      (data, { getResponseHeader }) => {
        getResponseHeader('header');
        return data;
      },
      { request: createRequest(), response }
    );

    expect(response.getHeader).toHaveBeenCalledWith('header');
    expect(response.getHeader).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response getHeaders method', async () => {
    const response = { getHeaders: vi.fn() } as unknown as Response;

    await callWithInterceptor(
      (data, { getResponseHeaders }) => {
        getResponseHeaders();
        return data;
      },
      { request: createRequest(), response }
    );

    expect(response.getHeaders).toHaveBeenCalledWith();
    expect(response.getHeaders).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response set method', async () => {
    const response = { set: vi.fn() } as unknown as Response;

    await callWithInterceptor(
      (data, { setHeader }) => {
        setHeader('name', 'value');
        return data;
      },
      { request: createRequest(), response }
    );

    expect(response.set).toHaveBeenCalledWith('name', 'value');
    expect(response.set).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response append method', async () => {
    const response = { append: vi.fn() } as unknown as Response;

    await callWithInterceptor(
      (data, { appendHeader }) => {
        appendHeader('name', 'value');
        return data;
      },
      { request: createRequest(), response }
    );

    expect(response.append).toHaveBeenCalledWith('name', 'value');
    expect(response.append).toHaveBeenCalledTimes(1);
  });

  it('Should correctly set statusCode into response', async () => {
    const response = {} as Response;

    await callWithInterceptor(
      (data, { setStatusCode }) => {
        setStatusCode(204);
        return data;
      },
      { request: createRequest(), response }
    );

    expect(response.statusCode).toBe(204);
  });

  it('Should correctly get cookie from request.cookies object', async () => {
    await callWithInterceptor(
      (data, { getCookie }) => {
        expect(getCookie('name')).toBe('value');
        return data;
      },
      { request: createRequest({ cookies: { name: 'value' } }), response: {} as Response }
    );
  });

  it('Should correctly call response cookie method with/without options', async () => {
    const response = { cookie: vi.fn() } as unknown as Response;

    await callWithInterceptor(
      (data, { setCookie }) => {
        setCookie('name', 'value');
        return data;
      },
      { request: createRequest(), response }
    );

    expect(response.cookie).toHaveBeenCalledWith('name', 'value');
    expect(response.cookie).toHaveBeenCalledTimes(1);

    vi.mocked(response.cookie).mockClear();

    await callWithInterceptor(
      (data, { setCookie }) => {
        setCookie('name', 'value', { path: '/your/path' });
        return data;
      },
      { request: createRequest(), response }
    );

    expect(response.cookie).toHaveBeenCalledWith('name', 'value', {
      path: '/your/path'
    });
    expect(response.cookie).toBeCalledTimes(1);
  });

  it('Should correctly call response clearCookie method', async () => {
    const response = { clearCookie: vi.fn() } as unknown as Response;

    await callWithInterceptor(
      (data, { clearCookie }) => {
        clearCookie('name', { path: '/your/path' });
        return data;
      },
      { request: createRequest(), response }
    );

    expect(response.clearCookie).toHaveBeenCalledWith('name', {
      path: '/your/path'
    });
    expect(response.clearCookie).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response attachment method', async () => {
    const response = { attachment: vi.fn() } as unknown as Response;

    await callWithInterceptor(
      (data, { attachment }) => {
        attachment('filename');
        return data;
      },
      { request: createRequest(), response }
    );

    expect(response.attachment).toHaveBeenCalledWith('filename');
    expect(response.attachment).toHaveBeenCalledTimes(1);
  });
});
