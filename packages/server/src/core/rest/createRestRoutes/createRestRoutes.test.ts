import bodyParser from 'body-parser';
import express from 'express';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';

import type { MockServerConfig, RestConfig, RestMethod } from '@/utils/types';

import { urlJoin } from '@/utils/helpers';
import { createTmpDir } from '@/utils/helpers/tests';

import { createRestRoutes } from './createRestRoutes';

const createServer = (
  mockServerConfig: Pick<MockServerConfig, 'baseUrl' | 'interceptors'> & {
    rest: RestConfig;
  }
) => {
  const { baseUrl, rest, interceptors } = mockServerConfig;
  const server = express();
  const routerBase = express.Router();
  const routerWithRoutes = createRestRoutes({
    router: routerBase,
    restConfig: rest,
    serverResponseInterceptor: interceptors?.response
  });

  server.use((request, _, next) => {
    request.context = { orm: {} };
    next();
  });

  const restBaseUrl = urlJoin(baseUrl ?? '/', rest?.baseUrl ?? '/');

  server.use(bodyParser.json());
  server.use(restBaseUrl, routerWithRoutes);
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
    expect(response.headers['cache-control']).toBe('no-cache');
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
                data: ({ url }, { query }) => ({
                  url,
                  query
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

  it('Should correctly use data function with polling enabled', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                settings: { polling: true },
                entities: {
                  query: {
                    key1: 'value1'
                  }
                },
                queue: [
                  {
                    data: ({ url }, { query }) => ({
                      url,
                      query
                    })
                  }
                ]
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

  it('Should return the same polling data until the specified time interval elapses', async () => {
    vi.useFakeTimers();
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                settings: { polling: true },
                queue: [
                  { time: 2000, data: { name: 'John', surname: 'Doe' } },
                  { data: { name: 'John', surname: 'Smith' } }
                ]
              }
            ]
          }
        ]
      }
    });

    const query = { key1: 'value1' };

    const firstResponse = await request(server).get('/users').query(query);
    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toEqual({ name: 'John', surname: 'Doe' });

    vi.advanceTimersByTime(1000);

    const secondResponse = await request(server).get('/users').query(query);
    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body).toEqual({ name: 'John', surname: 'Doe' });

    vi.advanceTimersByTime(1000);

    const thirdResponse = await request(server).get('/users').query(query);
    expect(thirdResponse.statusCode).toBe(200);
    expect(thirdResponse.body).toEqual({ name: 'John', surname: 'Smith' });

    vi.useRealTimers();
  });

  it('Should return 404 when the polling queue is empty', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                settings: { polling: true },
                queue: []
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');
    expect(response.statusCode).toBe(404);
  });

  it('Should correctly resolve data from a file', async () => {
    const tmpDirPath = createTmpDir();
    const pathToFile = path.join(tmpDirPath, './data.json') as `${string}.json`;
    fs.writeFileSync(pathToFile, JSON.stringify({ standName: 'The World' }));

    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                file: pathToFile
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(response.headers['content-disposition']).toMatch(/filename=(\S*data.json)/);
    expect(response.body).toStrictEqual({ standName: 'The World' });

    fs.rmSync(tmpDirPath, { recursive: true, force: true });
  });

  it('Should return 404 for invalid file paths', async () => {
    const tmpDirPath = createTmpDir();
    const pathToNonExistedFile = path.join(tmpDirPath, './data.json') as `${string}.json`;

    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                file: tmpDirPath
              }
            ]
          },
          {
            path: '/settings',
            method: 'get',
            routes: [
              {
                file: pathToNonExistedFile
              }
            ]
          }
        ]
      }
    });

    const tmpDirResponse = await request(server).get('/users');
    expect(tmpDirResponse.status).toBe(404);

    const nonExistedFileResponse = await request(server).get('/settings');
    expect(nonExistedFileResponse.status).toBe(404);

    fs.rmSync(tmpDirPath, { recursive: true, force: true });
  });

  it('should call response interceptor with Buffer as the first argument property when return a file', async () => {
    const tmpDirPath = createTmpDir();
    const pathToFile = path.join(tmpDirPath, './data.json') as `${string}.json`;
    const dataInFile = JSON.stringify({ standName: 'The World' });
    fs.writeFileSync(pathToFile, dataInFile);

    const routeInterceptor = vi.fn(() => 'Some random data');

    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                file: pathToFile,
                interceptors: { response: routeInterceptor }
              }
            ]
          }
        ]
      }
    });

    await request(server).get('/users');

    const routeInterceptorCallArgs = routeInterceptor.mock.calls[0] as any as [any, ...any[]];
    expect(routeInterceptorCallArgs[0].file).toStrictEqual(Buffer.from(dataInFile));
  });

  it('Should send a new file if interceptor return different path', async () => {
    const tmpDirPath = createTmpDir();

    const pathToFirstFile = path.join(tmpDirPath, './firstFile.json');
    fs.writeFileSync(pathToFirstFile, JSON.stringify({ standName: 'Star Platinum' }));

    const pathToSecondFile = path.join(tmpDirPath, './secondFile.json');
    fs.writeFileSync(pathToSecondFile, JSON.stringify({ standName: 'The World' }));

    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                file: pathToFirstFile,
                interceptors: {
                  response: ({ file }) => ({ path: pathToSecondFile, file })
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(response.headers['content-disposition']).toMatch(/filename=(\S*secondFile.json)/);
    expect(response.body).toStrictEqual({ standName: 'The World' });

    fs.rmSync(tmpDirPath, { recursive: true, force: true });
  });

  it('Should send a 404 if interceptor return file descriptor with invalid path', async () => {
    const tmpDirPath = createTmpDir();

    const existedFilePath = path.join(tmpDirPath, './existedFile.json');
    fs.writeFileSync(existedFilePath, JSON.stringify({ some: 'data' }));

    const notExistedFilePath = path.join(tmpDirPath, './notExistedFile.json');

    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                file: existedFilePath,
                interceptors: {
                  response: ({ file }) => ({ path: notExistedFilePath, file })
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('text/html; charset=utf-8');

    fs.rmSync(tmpDirPath, { recursive: true, force: true });
  });

  it('Should send a file descriptor "as is" if interceptor return invalid one', async () => {
    const tmpDirPath = createTmpDir();
    const pathToFile = path.join(tmpDirPath, './data.json');
    fs.writeFileSync(pathToFile, 'Star Platinum', 'utf-8');

    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                file: pathToFile,
                interceptors: {
                  response: ({ path }) => ({ path, file: 'file' })
                }
              }
            ]
          }
        ]
      }
    });

    const response = await request(server).get('/users');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(response.body).toStrictEqual({ path: pathToFile, file: 'file' });

    fs.rmSync(tmpDirPath, { recursive: true, force: true });
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

  it('Should cycle through queue data with polling setting', async () => {
    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                settings: { polling: true },
                queue: [
                  { data: { name: 'John', surname: 'Doe' } },
                  { data: { name: 'John', surname: 'Smith' } }
                ]
              }
            ]
          }
        ]
      }
    });

    const firstResponse = await request(server).get('/users');
    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const secondResponse = await request(server).get('/users');
    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body).toStrictEqual({ name: 'John', surname: 'Smith' });

    const thirdResponse = await request(server).get('/users');
    expect(thirdResponse.statusCode).toBe(200);
    expect(thirdResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should correctly process the request with file polling setting', async () => {
    const tmpDirPath = createTmpDir();

    const pathToFirstUser = path.join(tmpDirPath, './firstUser.json');
    fs.writeFileSync(pathToFirstUser, JSON.stringify({ name: 'John', surname: 'Doe' }));

    const pathToSecondUser = path.join(tmpDirPath, './secondUser.json');
    fs.writeFileSync(pathToSecondUser, JSON.stringify({ name: 'John', surname: 'Smith' }));

    const server = createServer({
      rest: {
        configs: [
          {
            path: '/users',
            method: 'get',
            routes: [
              {
                settings: { polling: true },
                queue: [{ file: pathToFirstUser }, { file: pathToSecondUser }]
              }
            ]
          }
        ]
      }
    });

    const firstResponse = await request(server).get('/users');
    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.headers['content-disposition']).toBe('filename=firstUser.json');
    expect(firstResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const secondResponse = await request(server).get('/users');
    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.headers['content-disposition']).toBe('filename=secondUser.json');
    expect(secondResponse.body).toStrictEqual({ name: 'John', surname: 'Smith' });

    const thirdResponse = await request(server).get('/users');
    expect(thirdResponse.statusCode).toBe(200);
    expect(thirdResponse.headers['content-disposition']).toBe('filename=firstUser.json');
    expect(thirdResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    fs.rmSync(tmpDirPath, { recursive: true, force: true });
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
    expect(successResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const failedResponse = await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send([{ key1: 'value1', key2: { nestedKey1: 'nestedValue1', nestedKey2: 'nestedValue2' } }]);
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
    expect(successResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const failedResponse = await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ key1: 'value1', key2: { nestedKey1: 'nestedValue1', nestedKey2: 'nestedValue2' } });
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
      .send({ key1: { nestedKey1: 'nestedValue1' }, key2: { nestedKey2: 'nestedValue2' } });

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
    // request interceptor called when path and method is matched even if server return 404
    await request(server)
      .post('/users')
      .set('Content-Type', 'application/json')
      .send({ key3: 'value3', key4: 'value4' });
    expect(requestInterceptor).toBeCalledTimes(2);
    expect(routeInterceptor).toBeCalledTimes(1);

    await request(server)
      .post('/settings')
      .set('Content-Type', 'application/json')
      .send({ key1: 'value1', key2: 'value2' });
    expect(requestInterceptor).toBeCalledTimes(2);
    expect(routeInterceptor).toBeCalledTimes(1);
  });
});
