import type { Request, Response } from 'express';

import { callResponseLogger } from './callResponseLogger';

describe('callResponseLogger', () => {
  const request = {
    url: '/posts/2',
    method: 'POST',
    body: {},
    id: 1,
    timestamp: 1735623296789,
    graphQL: null,
    cookies: { token: 'token' },
    get: (headerName: string) => headerName,
    protocol: 'http',
    originalUrl: '/api/rest/posts/2'
  } as Request;

  const response = {
    statusCode: 200
  } as Response;

  const data = { key: 'value' };

  vi.spyOn(Date, 'now').mockImplementation(() => 1735623296789);

  it('Should log default tokens if logger or tokens was not provided', () => {
    const consoleDir = vi.spyOn(console, 'dir');

    callResponseLogger({ data, request, response });

    expect(consoleDir.mock.lastCall).toStrictEqual([
      {
        type: 'response',
        id: 1,
        timestamp: '31.12.2024, 12:34:56,789',
        method: 'POST',
        url: 'http://host/api/rest/posts/2',
        statusCode: 200,
        data: { key: 'value' }
      },
      { depth: null }
    ]);

    callResponseLogger({ logger: {}, data, request, response });

    expect(consoleDir.mock.lastCall).toStrictEqual([
      {
        type: 'response',
        id: 1,
        timestamp: '31.12.2024, 12:34:56,789',
        method: 'POST',
        url: 'http://host/api/rest/posts/2',
        statusCode: 200,
        data: { key: 'value' }
      },
      { depth: null }
    ]);
  });

  it('Should call rewrite function with unformatted tokens instead of default console.dir if provided', () => {
    const consoleDir = vi.spyOn(console, 'dir');
    const rewrite = vi.fn();

    callResponseLogger({ logger: { rewrite }, data, request, response });

    expect(consoleDir).toBeCalledTimes(0);
    expect(rewrite).toBeCalledTimes(1);
    expect(rewrite.mock.lastCall).toStrictEqual([
      {
        type: 'response',
        id: 1,
        timestamp: 1735623296789,
        method: 'post',
        url: 'http://host/api/rest/posts/2',
        statusCode: 200,
        data: { key: 'value' }
      }
    ]);
  });

  it('Should return logged tokens', () => {
    const rewrite = vi.fn();

    expect(callResponseLogger({ data, request, response })).toStrictEqual({
      type: 'response',
      id: 1,
      timestamp: 1735623296789,
      method: 'post',
      url: 'http://host/api/rest/posts/2',
      statusCode: 200,
      data: { key: 'value' }
    });

    expect(callResponseLogger({ logger: { rewrite }, data, request, response })).toStrictEqual({
      type: 'response',
      id: 1,
      timestamp: 1735623296789,
      method: 'post',
      url: 'http://host/api/rest/posts/2',
      statusCode: 200,
      data: { key: 'value' }
    });
  });
});
