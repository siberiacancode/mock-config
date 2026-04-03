import bodyParser from 'body-parser';
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type {
  BaseServerConfig,
  BaseUrl,
  RestConfig,
  RestMethod,
  RestRequestArtifact
} from '@/utils/types';

import { urlJoin } from '@/utils/helpers';

import { createRestRoute } from './createRestRoute';
import { calculateRestRouteConfigWeight, prepareRestRequestArtifacts } from './helpers';

const createServer = (
  mockServerConfig: Pick<BaseServerConfig, 'baseUrl' | 'interceptors'> & {
    rest: RestConfig;
  }
) => {
  const { baseUrl, rest, interceptors } = mockServerConfig;
  const server = express();

  server.use((request, _, next) => {
    request.context = { orm: {} };
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
            serverResponseInterceptor: interceptors?.response,
            serverRequestInterceptor: interceptors?.request,
            requestResponseInterceptor: config.interceptors?.response,
            requestRequestInterceptor: config.interceptors?.request,
            componentResponseInterceptor: undefined,
            componentRequestInterceptor: undefined,
            routeResponseInterceptor: route.interceptors?.response,
            routeRequestInterceptor: route.interceptors?.request
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
                  query: {
                    key1: 'value1'
                  }
                },
                data: ({ request, entities }) => ({
                  url: request.url,
                  query: entities.query as Record<string, string>
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
                  query: {
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
                  query: {
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
                  query: {
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

  it('Should strictly compare plain array body if top level descriptor used', async () => {
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
                    checkMode: 'equals',
                    value: [
                      {
                        key1: 'value1',
                        key2: { nestedKey1: 'nestedValue1' }
                      }
                    ]
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const successResponse = await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send([{ key1: 'value1', key2: { nestedKey1: 'nestedValue1' } }]);
    expect(successResponse.statusCode).toBe(200);
    expect(successResponse.body).toStrictEqual({
      name: 'John',
      surname: 'Doe'
    });

    const failedResponse = await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send([
        {
          key1: 'value1',
          key2: { nestedKey1: 'nestedValue1', nestedKey2: 'nestedValue2' }
        }
      ]);
    expect(failedResponse.statusCode).toBe(404);
  });

  it('Should strictly compare plain object body if top level descriptor used', async () => {
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
                    checkMode: 'equals',
                    value: {
                      key1: 'value1',
                      key2: { nestedKey1: 'nestedValue1' }
                    }
                  }
                },
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const successResponse = await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ key1: 'value1', key2: { nestedKey1: 'nestedValue1' } });
    expect(successResponse.statusCode).toBe(200);
    expect(successResponse.body).toStrictEqual({
      name: 'John',
      surname: 'Doe'
    });

    const failedResponse = await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({
        key1: 'value1',
        key2: { nestedKey1: 'nestedValue1', nestedKey2: 'nestedValue2' }
      });
    expect(failedResponse.statusCode).toBe(404);
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
                    'key2.nestedKey2': {
                      checkMode: 'equals',
                      value: 'nestedValue2'
                    }
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
                  body: {
                    checkMode: 'equals',
                    value: {}
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
      .send({});

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual({ name: 'John', surname: 'Doe' });
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

  it('Should call request interceptors in order: request -> route', async () => {
    const routeInterceptor = vi.fn();
    const requestInterceptor = vi.fn();

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
                    key1: 'value1',
                    key2: 'value2'
                  }
                },
                data: { name: 'John', surname: 'Doe' },
                interceptors: { request: routeInterceptor }
              }
            ],
            interceptors: { request: requestInterceptor }
          },
          {
            path: '/settings',
            method: 'post',
            routes: [
              {
                entities: {
                  body: {
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

    await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ key1: 'value1', key2: 'value2' });
    expect(requestInterceptor).toBeCalledTimes(1);
    expect(routeInterceptor).toBeCalledTimes(1);
    expect(requestInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      routeInterceptor.mock.invocationCallOrder[0]
    );

    // ✅ important:
    // request interceptor called when path and method is matched
    await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ key3: 'value3', key4: 'value4' });
    expect(requestInterceptor).toBeCalledTimes(1);
    expect(routeInterceptor).toBeCalledTimes(1);

    await request(server)
      .post('/settings')
      .set('Content-Type', 'application/json')
      .send({ key1: 'value1', key2: 'value2' });
    expect(requestInterceptor).toBeCalledTimes(1);
    expect(routeInterceptor).toBeCalledTimes(1);
  });
});
