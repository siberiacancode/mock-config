import type { Request, Response } from 'express';

import { describe, expect, it, vi } from 'vitest';

import type { ResponseInterceptor } from '@/utils/types';

import { callResponseInterceptors } from './callResponseInterceptors';

const createRequest = (value: object) =>
  ({
    context: { orm: {} },
    ...value
  }) as Request;

describe('callResponseInterceptors: order of calls', () => {
  it('Should call all passed response interceptors in order: route -> request -> api -> server', async () => {
    const initialData = '';
    const request = createRequest({});
    const response = {} as Response;
    const routeInterceptor = vi.fn((data) => `${data}routeInterceptor;`);
    const requestInterceptor = vi.fn((data) => `${data}requestInterceptor;`);
    const apiInterceptor = vi.fn((data) => `${data}apiInterceptor;`);
    const serverInterceptor = vi.fn((data) => `${data}serverInterceptor`);

    expect(
      await callResponseInterceptors({
        data: initialData,
        request,
        response
      })
    ).toBe('');
    expect(routeInterceptor).toBeCalledTimes(0);
    expect(requestInterceptor).toBeCalledTimes(0);
    expect(apiInterceptor).toBeCalledTimes(0);
    expect(serverInterceptor).toBeCalledTimes(0);

    expect(
      await callResponseInterceptors({
        data: initialData,
        request,
        response,
        interceptors: {
          routeInterceptor,
          apiInterceptor,
          requestInterceptor,
          serverInterceptor
        }
      })
    ).toBe('routeInterceptor;requestInterceptor;apiInterceptor;serverInterceptor');
    expect(routeInterceptor).toBeCalledTimes(1);
    expect(requestInterceptor).toBeCalledTimes(1);
    expect(apiInterceptor).toBeCalledTimes(1);
    expect(serverInterceptor).toBeCalledTimes(1);

    expect(routeInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      requestInterceptor.mock.invocationCallOrder[0]
    );
    expect(requestInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      apiInterceptor.mock.invocationCallOrder[0]
    );
    expect(apiInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      serverInterceptor.mock.invocationCallOrder[0]
    );
  });
});

describe('callResponseInterceptors: params functions', () => {
  it('Should correctly get header from request.headers when use getRequestHeader param', async () => {
    const data = null;
    const request = createRequest({ headers: { name: 'value' } });
    const response = {};

    const getCookieRouteInterceptor: ResponseInterceptor = (data, { getRequestHeader }) => {
      expect(getRequestHeader('name')).toBe('value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request: request as unknown as Request,
      response: response as Response,
      interceptors: {
        routeInterceptor: getCookieRouteInterceptor
      }
    });
  });

  it('Should correctly get headers property from request when use getRequestHeaders param', async () => {
    const data = null;
    const request = createRequest({ headers: { name: 'value' } });
    const response = {};

    const getCookieRouteInterceptor: ResponseInterceptor = (data, { getRequestHeaders }) => {
      expect(getRequestHeaders()).toBe(request.headers);
      return data;
    };
    await callResponseInterceptors({
      data,
      request: request as unknown as Request,
      response: response as Response,
      interceptors: {
        routeInterceptor: getCookieRouteInterceptor
      }
    });
  });

  it('Should correctly call response getHeader method when use getResponseHeader param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { getHeader: vi.fn() };

    const getHeaderRouteInterceptor: ResponseInterceptor = (data, { getResponseHeader }) => {
      getResponseHeader('header');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        routeInterceptor: getHeaderRouteInterceptor
      }
    });
    expect(response.getHeader).toHaveBeenCalledWith('header');
    expect(response.getHeader).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response getHeaders method when use getResponseHeaders param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { getHeaders: vi.fn() };

    const getHeadersRouteInterceptor: ResponseInterceptor = (data, { getResponseHeaders }) => {
      getResponseHeaders();
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        routeInterceptor: getHeadersRouteInterceptor
      }
    });
    expect(response.getHeaders).toHaveBeenCalledWith();
    expect(response.getHeaders).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response set method when use setHeader param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { set: vi.fn() };

    const setHeaderRouteInterceptor: ResponseInterceptor = (data, { setHeader }) => {
      setHeader('name', 'value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        routeInterceptor: setHeaderRouteInterceptor
      }
    });
    expect(response.set).toHaveBeenCalledWith('name', 'value');
    expect(response.set).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response append method when use appendHeader param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { append: vi.fn() };

    const appendHeaderRouteInterceptor: ResponseInterceptor = (data, { appendHeader }) => {
      appendHeader('name', 'value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        routeInterceptor: appendHeaderRouteInterceptor
      }
    });
    expect(response.append).toHaveBeenCalledWith('name', 'value');
    expect(response.append).toHaveBeenCalledTimes(1);
  });

  it('Should correctly set statusCode into response when use setStatusCode param', async () => {
    const data = null;
    const request = createRequest({});
    const response = {} as Response;

    const setStatusCodeRouteInterceptor: ResponseInterceptor = (data, { setStatusCode }) => {
      setStatusCode(204);
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response,
      interceptors: {
        routeInterceptor: setStatusCodeRouteInterceptor
      }
    });
    expect(response.statusCode).toBe(204);
  });

  it('Should correctly get cookie from request.cookies object when use getCookie param', async () => {
    const data = null;
    const request = createRequest({ cookies: { name: 'value' } });
    const response = {};

    const getCookieRouteInterceptor: ResponseInterceptor = (data, { getCookie }) => {
      expect(getCookie('name')).toBe('value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request: request as unknown as Request,
      response: response as Response,
      interceptors: {
        routeInterceptor: getCookieRouteInterceptor
      }
    });
  });

  it('Should correctly call response cookie method with/without options when use setCookie param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { cookie: vi.fn() };

    const setCookieWithoutOptionsRouteInterceptor: ResponseInterceptor = (data, { setCookie }) => {
      setCookie('name', 'value');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        routeInterceptor: setCookieWithoutOptionsRouteInterceptor
      }
    });
    expect(response.cookie).toHaveBeenCalledWith('name', 'value');
    expect(response.cookie).toHaveBeenCalledTimes(1);

    response.cookie.mockClear();

    const setCookieWithOptionsRouteInterceptor: ResponseInterceptor = (data, { setCookie }) => {
      setCookie('name', 'value', { path: '/your/path' });
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        routeInterceptor: setCookieWithOptionsRouteInterceptor
      }
    });
    expect(response.cookie).toHaveBeenCalledWith('name', 'value', { path: '/your/path' });
    expect(response.cookie).toBeCalledTimes(1);
  });

  it('Should correctly call response clearCookie method when use clearCookie param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { clearCookie: vi.fn() };

    const clearCookieRouteInterceptor: ResponseInterceptor = (data, { clearCookie }) => {
      clearCookie('name', { path: '/your/path' });
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        routeInterceptor: clearCookieRouteInterceptor
      }
    });
    expect(response.clearCookie).toHaveBeenCalledWith('name', { path: '/your/path' });
    expect(response.clearCookie).toHaveBeenCalledTimes(1);
  });

  it('Should correctly call response attachment method when use attachment param', async () => {
    const data = null;
    const request = createRequest({});
    const response = { attachment: vi.fn() };

    const attachmentRouteInterceptor: ResponseInterceptor = (data, { attachment }) => {
      attachment('filename');
      return data;
    };
    await callResponseInterceptors({
      data,
      request,
      response: response as unknown as Response,
      interceptors: {
        routeInterceptor: attachmentRouteInterceptor
      }
    });
    expect(response.attachment).toHaveBeenCalledWith('filename');
    expect(response.attachment).toHaveBeenCalledTimes(1);
  });
});
