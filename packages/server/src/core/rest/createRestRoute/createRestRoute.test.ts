import type { Mock } from 'vitest';

import bodyParser from 'body-parser';
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type {
  BaseServerConfig,
  BaseUrl,
  Interceptor,
  RestMethod,
  RestRequestArtifact,
  RestRequestConfig
} from '@/utils/types';

import { rest as restInterceptors } from '@/core/interceptors';
import { parseCookie, urlJoin } from '@/utils/helpers';

import { haveEntries, regExp } from '../../entities';
import { createRestRoute } from './createRestRoute';
import { calculateRestRouteConfigWeight, prepareRestRequestArtifacts } from './helpers';

interface RestConfig {
  baseUrl?: BaseUrl;
  configs: RestRequestConfig[];
  interceptors?: Interceptor[];
}

const createServer = (
  mockServerConfig: Pick<BaseServerConfig, 'baseUrl' | 'interceptors'> & {
    rest: RestConfig;
  }
) => {
  const { baseUrl, rest, interceptors } = mockServerConfig;
  const server = express();

  // ✅ important: contextMiddleware does it in real server, tests use bare express app
  server.use((request, _, next) => {
    request.context = { orm: {}, broadcast: vi.fn() };
    request.queries = request.query as Record<string, string | string[]>;
    request.cookies = parseCookie(request.headers.cookie ?? '');
    next();
  });

  server.use(bodyParser.json());

  createRestRoute({
    server,
    restRequestArtifacts: prepareRestRequestArtifacts(
      rest.configs.reduce((acc, config) => {
        config.routes.forEach((route) => {
          acc.push({
            baseUrl: urlJoin(baseUrl ?? '/', rest?.baseUrl ?? '/') as BaseUrl,
            method: config.method,
            path: config.path,
            config: route,
            weight: calculateRestRouteConfigWeight(route),
            componentInterceptors: rest.interceptors,
            serverInterceptors: interceptors
          });
        });

        return acc;
      }, [] as RestRequestArtifact[])
    )
  });

  return server;
};

describe('createRestRoutes: routing', () => {
  it('Should match config with path regexp', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: /^\/us(.+?)rs$/,
            method: 'get',
            routes: [
              {
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const firstResponse = await request(server).get('/users');
    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const secondResponse = await request(server).get('/usersForCreators');
    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should return 404 for no matched request configs', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                entities: {
                  headers: {
                    key1: 'value1'
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users').set({ key2: 'value2' });

    expect(response.statusCode).toBe(404);
  });

  it('Should match multi-segment wildcard path', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users/**',
            method: 'get',
            routes: [
              {
                data: { ok: true }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users/some/nested/path');
    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ ok: true });
  });

  it('Should have response Cache-Control header value equals to no-cache', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [{ data: { name: 'John', surname: 'Doe' } }]
          }
        ]
      }
    });

    const response = await request(server).get('/users');
    expect(response.headers['cache-control']).toBe('no-store');
  });

  const methodsWithoutCacheControlHeader: Exclude<RestMethod, 'get'>[] = [
    'post',
    'put',
    'patch',
    'delete',
    'options'
  ];
  methodsWithoutCacheControlHeader.forEach((methodWithoutCacheControlHeader) => {
    it(`Should do not have response Cache-Control header if method is ${methodWithoutCacheControlHeader}`, async () => {
      const server = createServer({
        rest: {
          configs: [
            {
              path: '/users',
              method: methodWithoutCacheControlHeader,
              routes: [{ data: { name: 'John', surname: 'Doe' } }]
            }
          ]
        }
      });

      const response = await request(server)[methodWithoutCacheControlHeader]('/users');
      expect(response.headers['cache-control']).toBe(undefined);
    });
  });

  it('Should expose path params to the route', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users/:id',
            method: 'get',
            routes: [{ data: ({ request }) => ({ params: request.params }) }]
          }
        ]
      }
    });

    const response = await request(server).get('/users/123');

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ params: { id: '123' } });
  });

  it('Should decode URL-encoded path params', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users/:id',
            method: 'get',
            routes: [{ data: ({ request }) => ({ params: request.params }) }]
          }
        ]
      }
    });

    const response = await request(server).get('/users/John%20Doe');

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ params: { id: 'John Doe' } });
  });

  it('Should not extract path params when the request path has a trailing slash', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users/:id',
            method: 'get',
            routes: [{ data: ({ request }) => ({ params: request.params }) }]
          }
        ]
      }
    });

    const response = await request(server).get('/users/123/');

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ params: {} });
  });

  it('Should return 404 when no request config matches path', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [{ data: { name: 'John', surname: 'Doe' } }]
          }
        ]
      }
    });

    const response = await request(server).get('/posts');

    expect(response.statusCode).toBe(404);
  });
});

describe('createRestRoutes: content', () => {
  it('Should correctly use data function', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                entities: {
                  queries: {
                    key1: 'value1'
                  }
                },
                data: ({ request, entities }) => ({
                  url: request.url,
                  query: entities.queries
                })
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users').query({ key1: 'value1' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      url: '/users?key1=value1',
      query: {
        key1: 'value1'
      }
    });
  });

  it('Should expose request header helpers to the data function', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: ({ getRequestHeader, getRequestHeaders }) => ({
                  header: getRequestHeader('key1'),
                  hasHeaderInList: 'key1' in getRequestHeaders()
                })
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users').set({ key1: 'value1' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ header: 'value1', hasHeaderInList: true });
  });

  it('Should set and read response headers from the data function', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: ({ setHeader, appendHeader, getResponseHeader, getResponseHeaders }) => {
                  setHeader('key1', 'value1');
                  appendHeader('key2', 'value2');

                  return {
                    header: getResponseHeader('key1'),
                    hasHeaderInList: 'key2' in getResponseHeaders()
                  };
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.headers.key1).toBe('value1');
    expect(response.headers.key2).toBe('value2');
    expect(response.body).toStrictEqual({ header: 'value1', hasHeaderInList: true });
  });

  it('Should set cookies from the data function', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: ({ setCookie }) => {
                  setCookie('token', 'abc');
                  setCookie('session', 'xyz', { maxAge: 1000 });

                  return { name: 'John', surname: 'Doe' };
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.headers['set-cookie']).toStrictEqual([
      expect.stringContaining('token=abc'),
      expect.stringContaining('session=xyz')
    ]);
    expect(response.headers['set-cookie'][1]).toContain('Max-Age');
  });

  it('Should read and clear cookies from the data function', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: ({ getCookie, clearCookie }) => {
                  clearCookie('token');

                  return { token: getCookie('token') };
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users').set('Cookie', 'token=abc');

    expect(response.body).toStrictEqual({ token: 'abc' });
    expect(response.headers['set-cookie'][0]).toContain('token=;');
  });

  it('Should attach a filename to the response', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: ({ attachment }) => {
                  attachment('users.csv');

                  return 'name,surname';
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.headers['content-disposition']).toBe('attachment; filename="users.csv"');
    expect(response.text).toBe('name,surname');
  });

  it('Should broadcast payload from the data function', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: ({ request, broadcast }) => {
                  broadcast({ message: 'hello' });

                  return {
                    broadcasted: (request.context.broadcast as unknown as Mock).mock.calls[0][0]
                  };
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.body).toStrictEqual({ broadcasted: { message: 'hello' } });
  });

  it('Should set the status code from the data function', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: ({ setStatusCode }) => {
                  setStatusCode(201);

                  return { name: 'John', surname: 'Doe' };
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.statusCode).toBe(201);
    expect(response.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should delay the response from the data function', async () => {
    const delay = 100;
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: async ({ setDelay }) => {
                  await setDelay(delay);

                  return { name: 'John', surname: 'Doe' };
                }
              }
            ]
          }
        ]
      }
    });

    const startTime = performance.now();
    const response = await request(server).get('/users');
    const endTime = performance.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(delay);
    expect(response.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should not send data when the data function has already sent the response', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: ({ response }) => {
                  response.send('from data');

                  return { name: 'John', surname: 'Doe' };
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('from data');
  });

  it('Should send raw data when a content type is already set', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                data: ({ setHeader }) => {
                  setHeader('Content-Type', 'text/plain');

                  return 'plain text';
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toBe('plain text');
  });
});

describe('createRestRoutes: settings', () => {
  it('Should correctly delay response based on delay setting', async () => {
    const delay = 1000;
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                settings: { delay },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const startTime = performance.now();
    const response = await request(server).get('/users');
    const endTime = performance.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(delay);
    expect(response.body).toEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should correctly set status code of response based on status setting', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                settings: { status: 500 },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ name: 'John', surname: 'Doe' });
  });
});

describe('createRestRoutes: entities', () => {
  it('Should match route configuration when actual entities include specified properties', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                entities: {
                  headers: {
                    key1: 'value1',
                    key2: 'value2'
                  },
                  queries: {
                    key1: 'value1'
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server)
      .get('/users')
      .set({ key1: 'value1', key2: 'value2' })
      .query({ key1: 'value1', key2: 'value2' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should prioritize more specific route configuration when multiple matches exist', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                entities: {
                  headers: {
                    key1: 'value1',
                    key2: 'value2'
                  },
                  queries: {
                    key1: 'value1'
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              },
              {
                entities: {
                  headers: {
                    key1: 'value1',
                    key2: 'value2'
                  },
                  queries: {
                    key1: 'value1',
                    key2: 'value2'
                  }
                },
                data: { name: 'John', surname: 'Smith' }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server)
      .get('/users')
      .set({ key1: 'value1', key2: 'value2' })
      .query({ key1: 'value1', key2: 'value2' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ name: 'John', surname: 'Smith' });
  });

  it('Should correctly resolve flat object body with nested key matching', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'post',
            routes: [
              {
                entities: {
                  body: {
                    'key1.nestedKey1': 'nestedValue1',
                    'key2.nestedKey2': 'nestedValue2'
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({
        key1: { nestedKey1: 'nestedValue1' },
        key2: { nestedKey2: 'nestedValue2' }
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should be case-insensitive for header keys', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                entities: {
                  headers: {
                    lowercase: 'lowercase',
                    UPPERCASE: 'UPPERCASE'
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server)
      .get('/users')
      .set('Content-Type', 'application/json')
      .set({ LowerCase: 'lowercase', upperCase: 'UPPERCASE' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should correctly handle empty object body', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'post',
            routes: [
              {
                entities: {
                  body: {}
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({});

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should match route configuration by params entity', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users/:id',
            method: 'get',
            routes: [
              {
                entities: {
                  params: {
                    id: '123'
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const matchedResponse = await request(server).get('/users/123');
    expect(matchedResponse.statusCode).toBe(200);
    expect(matchedResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const unmatchedResponse = await request(server).get('/users/456');
    expect(unmatchedResponse.statusCode).toBe(404);
  });

  it('Should match entity by top-level comparator', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                entities: {
                  queries: haveEntries({ key1: 'value1' })
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const matchedResponse = await request(server).get('/users').query({ key1: 'value1' });
    expect(matchedResponse.statusCode).toBe(200);
    expect(matchedResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const unmatchedResponse = await request(server).get('/users').query({ key1: 'value2' });
    expect(unmatchedResponse.statusCode).toBe(404);
  });

  it('Should match entity property by comparator', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                entities: {
                  headers: {
                    key1: regExp(/^value/)
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const matchedResponse = await request(server).get('/users').set({ key1: 'value1' });
    expect(matchedResponse.statusCode).toBe(200);
    expect(matchedResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const unmatchedResponse = await request(server).get('/users').set({ key1: 'other' });
    expect(unmatchedResponse.statusCode).toBe(404);
  });
});

describe('createRestRoutes: interceptors', () => {
  it('Should prioritize the most specific route across different request configs', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users/:id',
            method: 'get',
            routes: [
              {
                entities: {
                  headers: {
                    key1: 'value1'
                  }
                },
                data: { source: 'parameterized' }
              }
            ]
          },
          {
            path: '/users/123',
            method: 'get',
            routes: [
              {
                entities: {
                  headers: {
                    key1: 'value1',
                    key2: 'value2'
                  }
                },
                data: { source: 'static' }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users/123').set({
      key1: 'value1',
      key2: 'value2'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ source: 'static' });
  });

  it('Should call interceptors in order: component request -> component response -> server response', async () => {
    const componentRequestInterceptor = vi.fn();
    const componentResponseInterceptor = vi.fn((data) => data);
    const serverResponseInterceptor = vi.fn((data) => data);

    const server = createServer({
      // ✅ important: server request interceptors are called by middleware, not by route
      interceptors: [restInterceptors.response.post(serverResponseInterceptor)],
      rest: {
        interceptors: [
          restInterceptors.request.post(componentRequestInterceptor),
          restInterceptors.response.post(componentResponseInterceptor)
        ],
        configs: [
          {
            path: '/users',
            method: 'post',
            routes: [
              {
                entities: {
                  body: {
                    key1: 'value1',
                    key2: 'value2'
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ key1: 'value1', key2: 'value2' });

    expect(componentRequestInterceptor).toBeCalledTimes(1);
    expect(componentResponseInterceptor).toBeCalledTimes(1);
    expect(serverResponseInterceptor).toBeCalledTimes(1);
    expect(componentRequestInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      componentResponseInterceptor.mock.invocationCallOrder[0]
    );
    expect(componentResponseInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      serverResponseInterceptor.mock.invocationCallOrder[0]
    );
  });

  it('Should not send data when a response interceptor has already sent the response', async () => {
    const server = createServer({
      rest: {
        interceptors: [
          restInterceptors.response.get((data, { response }) => {
            response.send('from interceptor');
            return data;
          })
        ],
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [{ data: { name: 'John', surname: 'Doe' } }]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('from interceptor');
  });
});
