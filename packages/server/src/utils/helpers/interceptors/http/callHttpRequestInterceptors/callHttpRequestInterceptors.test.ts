import type { Request } from 'express';

import { describe, expect, it, vi } from 'vitest';

import { graphql, http, rest } from '@/core/interceptors';

import { callHttpRequestInterceptors } from './callHttpRequestInterceptors';

const createRequest = (value: object) =>
  ({
    headers: {},
    cookies: {},
    context: { orm: {} },
    ...value
  }) as Request;

describe('callHttpRequestInterceptors: order of calls', () => {
  it('Should call passed interceptors in order', async () => {
    const firstInterceptor = vi.fn();
    const secondInterceptor = vi.fn();

    await callHttpRequestInterceptors({
      request: createRequest({}),
      meta: { type: 'rest', method: 'get' },
      interceptors: [http.request.all(firstInterceptor), rest.request.get(secondInterceptor)]
    });

    expect(firstInterceptor).toBeCalledTimes(1);
    expect(secondInterceptor).toBeCalledTimes(1);
    expect(firstInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      secondInterceptor.mock.invocationCallOrder[0]
    );
  });
});

describe('callHttpRequestInterceptors: interceptors filtering', () => {
  it('Should call only interceptors matched by rest method', async () => {
    const allInterceptor = vi.fn();
    const getInterceptor = vi.fn();
    const postInterceptor = vi.fn();

    await callHttpRequestInterceptors({
      request: createRequest({}),
      meta: { type: 'rest', method: 'get' },
      interceptors: [
        rest.request.all(allInterceptor),
        rest.request.get(getInterceptor),
        rest.request.post(postInterceptor)
      ]
    });

    expect(allInterceptor).toBeCalledTimes(1);
    expect(getInterceptor).toBeCalledTimes(1);
    expect(postInterceptor).toBeCalledTimes(0);
  });

  it('Should call only interceptors matched by graphql operation type', async () => {
    const queryInterceptor = vi.fn();
    const mutationInterceptor = vi.fn();
    const restInterceptor = vi.fn();

    await callHttpRequestInterceptors({
      request: createRequest({}),
      meta: { type: 'graphql', operationType: 'query' },
      interceptors: [
        graphql.request.query(queryInterceptor),
        graphql.request.mutation(mutationInterceptor),
        rest.request.get(restInterceptor)
      ]
    });

    expect(queryInterceptor).toBeCalledTimes(1);
    expect(mutationInterceptor).toBeCalledTimes(0);
    expect(restInterceptor).toBeCalledTimes(0);
  });

  it('Should not call response interceptors', async () => {
    const responseInterceptor = vi.fn();

    await callHttpRequestInterceptors({
      request: createRequest({}),
      meta: { type: 'rest', method: 'get' },
      interceptors: [rest.response.get(responseInterceptor)]
    });

    expect(responseInterceptor).toBeCalledTimes(0);
  });
});

describe('callHttpRequestInterceptors: params functions', () => {
  it('Should correctly get header from request.headers object when use getHeader param', async () => {
    const request = createRequest({ headers: { name: 'value' } });
    const interceptor = vi.fn(({ getHeader }) => {
      expect(getHeader('name')).toBe('value');
    });

    await callHttpRequestInterceptors({
      request,
      meta: { type: 'rest', method: 'get' },
      interceptors: [rest.request.get(interceptor)]
    });

    expect(interceptor).toBeCalledTimes(1);
  });

  it('Should correctly get headers as request.headers object when use getHeaders param', async () => {
    const request = createRequest({ headers: { name: 'value' } });
    const interceptor = vi.fn(({ getHeaders }) => {
      expect(getHeaders()).toStrictEqual({ name: 'value' });
    });

    await callHttpRequestInterceptors({
      request,
      meta: { type: 'rest', method: 'get' },
      interceptors: [rest.request.get(interceptor)]
    });

    expect(interceptor).toBeCalledTimes(1);
  });

  it('Should correctly get cookie from request.cookies object when use getCookie param', async () => {
    const request = createRequest({ cookies: { name: 'value' } });
    const interceptor = vi.fn(({ getCookie }) => {
      expect(getCookie('name')).toBe('value');
    });

    await callHttpRequestInterceptors({
      request,
      meta: { type: 'rest', method: 'get' },
      interceptors: [rest.request.get(interceptor)]
    });

    expect(interceptor).toBeCalledTimes(1);
  });

  it('Should correctly provide request and setDelay', async () => {
    const request = createRequest({});
    const interceptor = vi.fn();

    await callHttpRequestInterceptors({
      request,
      meta: { type: 'rest', method: 'get' },
      interceptors: [rest.request.get(interceptor)]
    });

    const params = interceptor.mock.calls[0][0];
    expect(params.request).toBe(request);
    expect(typeof params.setDelay).toBe('function');
  });
});
