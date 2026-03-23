import type { Request } from 'express';

import { describe, expect, it, vi } from 'vitest';

import { callRequestLogger } from './callRequestLogger';

describe('callRequestLogger', () => {
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

  it('Should log default tokens if logger or options was not provided', () => {
    const consoleDir = vi.spyOn(console, 'dir');

    callRequestLogger({ request });

    expect(consoleDir.mock.lastCall).toStrictEqual([
      {
        type: 'request',
        id: 1,
        timestamp: '31.12.2024, 12:34:56,789',
        method: 'POST',
        url: 'http://host/api/rest/posts/2'
      },
      { depth: null }
    ]);

    callRequestLogger({ logger: {}, request });

    expect(consoleDir.mock.lastCall).toStrictEqual([
      {
        type: 'request',
        id: 1,
        timestamp: '31.12.2024, 12:34:56,789',
        method: 'POST',
        url: 'http://host/api/rest/posts/2'
      },
      { depth: null }
    ]);
  });

  it('Should call rewrite function with unformatted tokens instead of default console.dir if provided', () => {
    const consoleDir = vi.spyOn(console, 'dir');
    const rewrite = vi.fn();

    callRequestLogger({ logger: { rewrite }, request });

    expect(consoleDir).toBeCalledTimes(0);
    expect(rewrite).toBeCalledTimes(1);
    expect(rewrite.mock.lastCall).toStrictEqual([
      {
        type: 'request',
        id: 1,
        timestamp: 1735623296789,
        method: 'post',
        url: 'http://host/api/rest/posts/2'
      }
    ]);
  });

  it('Should return logged tokens', () => {
    const rewrite = vi.fn();

    expect(callRequestLogger({ request })).toStrictEqual({
      type: 'request',
      id: 1,
      timestamp: 1735623296789,
      method: 'post',
      url: 'http://host/api/rest/posts/2'
    });

    expect(callRequestLogger({ logger: { rewrite }, request })).toStrictEqual({
      type: 'request',
      id: 1,
      timestamp: 1735623296789,
      method: 'post',
      url: 'http://host/api/rest/posts/2'
    });
  });
});
