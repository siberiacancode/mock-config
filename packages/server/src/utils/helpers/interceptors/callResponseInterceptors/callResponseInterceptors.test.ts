import type { Request, Response } from 'express';

import { describe, expect, it, vi } from 'vitest';

import type { ResponseInterceptor } from '@/utils/types';

import { callResponseInterceptors } from './callResponseInterceptors';

const createRequest = (value: object) =>
  ({
    ...value
  }) as Request;

describe('callResponseInterceptors: order of calls', () => {
  it('Should call all passed response interceptors in order: component -> server', async () => {
    const initialData = '';
    const request = createRequest({});
    const response = {} as Response;
    const componentInterceptor = vi.fn((data) => `${data}componentInterceptor;`);
    const serverInterceptor = vi.fn((data) => `${data}serverInterceptor`);

    expect(
      await callResponseInterceptors({
        data: initialData,
        request,
        response
      })
    ).toBe('');
    expect(componentInterceptor).toBeCalledTimes(0);
    expect(serverInterceptor).toBeCalledTimes(0);

    expect(
      await callResponseInterceptors({
        data: initialData,
        request,
        response,
        interceptors: {
          componentInterceptor,
          serverInterceptor
        }
      })
    ).toBe('componentInterceptor;serverInterceptor');
    expect(componentInterceptor).toBeCalledTimes(1);
    expect(serverInterceptor).toBeCalledTimes(1);

    expect(componentInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      serverInterceptor.mock.invocationCallOrder[0]
    );
  });
});

describe('callResponseInterceptors: params functions', () => {
  it('Should correctly get header from request.headers when use getRequestHeader param', async () => {
    const data = null;
    const request = createRequest({ headers: { name: 'value' } });
    const response = {};

    const getCookieComponentInterceptor: ResponseInterceptor = (data, { getRequestHeader }) => {
      expect(getRequestHeader('name')).toBe('value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request: request as unknown as Request,
      response: response as Response,
      interceptors: {
        componentInterceptor: getCookieComponentInterceptor
      }
    });
  });

  it('Should correctly get headers property from request when use getRequestHeaders param', async () => {
    const data = null;
    const request = createRequest({ headers: { name: 'value' } });
    const response = {};

    const getCookieComponentInterceptor: ResponseInterceptor = (data, { getRequestHeaders }) => {
      expect(getRequestHeaders()).toBe(request.headers);
      return data;
    };
    await callResponseInterceptors({
      data,
      request: request as unknown as Request,
      response: response as Response,
      interceptors: {
        componentInterceptor: getCookieComponentInterceptor
      }
    });
  });

  it('Should correctly call response getHeader method when use getResponseHeader param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { getHeader: vi.fn() };

    const getHeaderComponentInterceptor: ResponseInterceptor = (data, { getResponseHeader }) => {
      getResponseHeader('header');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        componentInterceptor: getHeaderComponentInterceptor
      }
    });
    expect(response.getHeader).toHaveBeenCalledWith('header');
    expect(response.getHeader).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response getHeaders method when use getResponseHeaders param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { getHeaders: vi.fn() };

    const getHeadersComponentInterceptor: ResponseInterceptor = (data, { getResponseHeaders }) => {
      getResponseHeaders();
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        componentInterceptor: getHeadersComponentInterceptor
      }
    });
    expect(response.getHeaders).toHaveBeenCalledWith();
    expect(response.getHeaders).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response set method when use setHeader param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { set: vi.fn() };

    const setHeaderComponentInterceptor: ResponseInterceptor = (data, { setHeader }) => {
      setHeader('name', 'value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        componentInterceptor: setHeaderComponentInterceptor
      }
    });
    expect(response.set).toHaveBeenCalledWith('name', 'value');
    expect(response.set).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response append method when use appendHeader param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { append: vi.fn() };

    const appendHeaderComponentInterceptor: ResponseInterceptor = (data, { appendHeader }) => {
      appendHeader('name', 'value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        componentInterceptor: appendHeaderComponentInterceptor
      }
    });
    expect(response.append).toHaveBeenCalledWith('name', 'value');
    expect(response.append).toHaveBeenCalledTimes(1);
  });

  it('Should correctly set statusCode into response when use setStatusCode param', async () => {
    const data = null;
    const request = createRequest({});
    const response = {} as Response;

    const setStatusCodeComponentInterceptor: ResponseInterceptor = (data, { setStatusCode }) => {
      setStatusCode(204);
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response,
      interceptors: {
        componentInterceptor: setStatusCodeComponentInterceptor
      }
    });
    expect(response.statusCode).toBe(204);
  });

  it('Should correctly get cookie from request.cookies object when use getCookie param', async () => {
    const data = null;
    const request = createRequest({ cookies: { name: 'value' } });
    const response = {};

    const getCookieComponentInterceptor: ResponseInterceptor = (data, { getCookie }) => {
      expect(getCookie('name')).toBe('value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request: request as unknown as Request,
      response: response as Response,
      interceptors: {
        componentInterceptor: getCookieComponentInterceptor
      }
    });
  });

  it('Should correctly call response cookie method with/without options when use setCookie param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { cookie: vi.fn() };

    const setCookieWithoutOptionsComponentInterceptor: ResponseInterceptor = (
      data,
      { setCookie }
    ) => {
      setCookie('name', 'value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        componentInterceptor: setCookieWithoutOptionsComponentInterceptor
      }
    });
    expect(response.cookie).toHaveBeenCalledWith('name', 'value');
    expect(response.cookie).toHaveBeenCalledTimes(1);

    response.cookie.mockClear();

    const setCookieWithOptionsComponentInterceptor: ResponseInterceptor = (data, { setCookie }) => {
      setCookie('name', 'value', { path: '/your/path' });
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        componentInterceptor: setCookieWithOptionsComponentInterceptor
      }
    });
    expect(response.cookie).toHaveBeenCalledWith('name', 'value', {
      path: '/your/path'
    });
    expect(response.cookie).toBeCalledTimes(1);
  });

  it('Should correctly call response clearCookie method when use clearCookie param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { clearCookie: vi.fn() };

    const clearCookieComponentInterceptor: ResponseInterceptor = (data, { clearCookie }) => {
      clearCookie('name', { path: '/your/path' });
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        componentInterceptor: clearCookieComponentInterceptor
      }
    });
    expect(response.clearCookie).toHaveBeenCalledWith('name', {
      path: '/your/path'
    });
    expect(response.clearCookie).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response attachment method when use attachment param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { attachment: vi.fn() };

    const attachmentComponentInterceptor: ResponseInterceptor = (data, { attachment }) => {
      attachment('filename');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        componentInterceptor: attachmentComponentInterceptor
      }
    });
    expect(response.attachment).toHaveBeenCalledWith('filename');
    expect(response.attachment).toHaveBeenCalledTimes(1);
  });
});
