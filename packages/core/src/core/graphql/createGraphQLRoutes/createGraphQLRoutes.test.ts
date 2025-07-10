import bodyParser from 'body-parser';
import express from 'express';
import request from 'supertest';

import type { GraphqlConfig, GraphQLOperationType, MockServerConfig } from '@/utils/types';

import { urlJoin } from '@/utils/helpers';

import { createGraphQLRoutes } from './createGraphQLRoutes';

const createServer = (
  mockServerConfig: Pick<MockServerConfig, 'baseUrl' | 'interceptors'> & {
    graphql: GraphqlConfig;
  }
) => {
  const { baseUrl, graphql, interceptors } = mockServerConfig;
  const server = express();
  const routerBase = express.Router();
  const routerWithRoutes = createGraphQLRoutes({
    router: routerBase,
    graphqlConfig: graphql,
    serverResponseInterceptor: interceptors?.response
  });

  server.use((request, _, next) => {
    request.context = { orm: {} };
    next();
  });

  const graphqlBaseUrl = urlJoin(baseUrl ?? '/', graphql?.baseUrl ?? '/');

  server.use(bodyParser.json());
  server.use(graphqlBaseUrl, routerWithRoutes);
  return server;
};

describe('createGraphQLRoutes: routing', () => {
  it('Should match config with operationName', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
            routes: [
              {
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const postResponse = await request(server)
      .post('/')
      .send({ query: 'query GetUsers { users { name } }' });
    expect(postResponse.statusCode).toBe(200);
    expect(postResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const getResponse = await request(server).get('/').query({
      query: 'query GetUsers { users { name } }'
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should match config with operationName regExp', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: /^Get(.+?)sers$/g,
            operationType: 'query',
            routes: [
              {
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const firstPostResponse = await request(server)
      .post('/')
      .send({ query: 'query GetUsers { users { name } }' });
    expect(firstPostResponse.statusCode).toBe(200);
    expect(firstPostResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const firstGetResponse = await request(server).get('/').query({
      query: 'query GetUsers { users { name } }'
    });
    expect(firstGetResponse.statusCode).toBe(200);
    expect(firstGetResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const secondPostResponse = await request(server)
      .post('/')
      .send({ query: 'query GetAnotherUsers { users { name } }' });
    expect(secondPostResponse.statusCode).toBe(200);
    expect(secondPostResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const secondGetResponse = await request(server).get('/').query({
      query: 'query GetAnotherUsers { users { name } }'
    });
    expect(secondGetResponse.statusCode).toBe(200);
    expect(secondGetResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should match config with query independent of spaces and new lines', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            query: 'query { User { name } }',
            operationType: 'query',
            routes: [
              {
                data: { name: 'John', surname: 'Doe' }
              }
            ]
          }
        ]
      }
    });

    const postResponse = await request(server)
      .post('/')
      .send({ query: 'query {\n User {\n  name\n  }\n}\n' });
    expect(postResponse.statusCode).toBe(200);
    expect(postResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const getResponse = await request(server).get('/').query({
      query: 'query {\n User {\n  name\n  }\n}\n'
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should return 400 and description text for invalid query', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const postResponse = await request(server).post('/').send({ query: 'invalid query' });

    expect(postResponse.statusCode).toBe(400);
    expect(postResponse.body).toStrictEqual({
      message: 'Query is invalid, you must use a valid GraphQL query'
    });

    const getResponse = await request(server).get('/').query({
      query: 'invalid query'
    });

    expect(postResponse.statusCode).toBe(400);
    expect(getResponse.body).toStrictEqual({
      message: 'Query is invalid, you must use a valid GraphQL query'
    });
  });

  it('Should return 404 for no matched request configs', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const postResponse = await request(server)
      .post('/')
      .send({ query: 'query GetUsers { users { name } }' })
      .set({ key2: 'value2' });

    expect(postResponse.statusCode).toBe(404);

    const getResponse = await request(server).get('/').set({ key2: 'value2' }).query({
      query: 'query GetUsers { users { name } }'
    });

    expect(getResponse.statusCode).toBe(404);
  });

  it('Should have response Cache-Control header value equals to no-cache', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
            routes: [{ data: { name: 'John', surname: 'Doe' } }]
          }
        ]
      }
    });

    const postResponse = await request(server)
      .post('/')
      .send({ query: 'query GetUsers { users { name } }' });
    expect(postResponse.headers['cache-control']).toBe('no-cache');

    const getResponse = await request(server)
      .get('/')
      .query({ query: 'query GetUsers { users { name } }' });
    expect(getResponse.headers['cache-control']).toBe('no-cache');
  });

  const operationTypesWithoutCacheControlHeader: Exclude<GraphQLOperationType, 'query'>[] = [
    'mutation'
  ];
  operationTypesWithoutCacheControlHeader.forEach((operationTypeWithoutCacheControlHeader) => {
    it(`Should do not have Cache-Control header if operation type is ${operationTypeWithoutCacheControlHeader}`, async () => {
      const server = createServer({
        graphql: {
          configs: [
            {
              operationName: 'GetUsers',
              operationType: operationTypeWithoutCacheControlHeader,
              routes: [{ data: { name: 'John', surname: 'Doe' } }]
            }
          ]
        }
      });

      const postResponse = await request(server)
        .post('/')
        .send({ query: 'query GetUsers { users { name } }' });
      expect(postResponse.headers['cache-control']).toBe(undefined);

      const getResponse = await request(server)
        .get('/')
        .query({ query: 'query GetUsers { users { name } }' });
      expect(getResponse.headers['cache-control']).toBe(undefined);
    });
  });
});

describe('createGraphQLRoutes: content', () => {
  it('Should correctly use data function', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const response = await request(server).get('/').query({
      query: 'query GetUsers { users { name } }',
      key1: 'value1'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      url: `/?query=${encodeURIComponent('query GetUsers { users { name } }')}&key1=value1`,
      query: {
        key1: 'value1'
      }
    });
  });

  it('Should correctly use data function with polling enabled', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const response = await request(server).get('/').query({
      query: 'query GetUsers { users { name } }',
      key1: 'value1'
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      url: `/?query=${encodeURIComponent('query GetUsers { users { name } }')}&key1=value1`,
      query: {
        key1: 'value1'
      }
    });
  });

  it('Should return the same polling data until the specified time interval elapses', async () => {
    vi.useFakeTimers();
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const query = {
      query: 'query GetUsers { users { name } }',
      key1: 'value1'
    };

    const firstResponse = await request(server).get('/').query(query);
    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toEqual({ name: 'John', surname: 'Doe' });

    vi.advanceTimersByTime(1000);

    const secondResponse = await request(server).get('/').query(query);
    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body).toEqual({ name: 'John', surname: 'Doe' });

    vi.advanceTimersByTime(1000);

    const thirdResponse = await request(server).get('/').query(query);
    expect(thirdResponse.statusCode).toBe(200);
    expect(thirdResponse.body).toEqual({ name: 'John', surname: 'Smith' });

    vi.useRealTimers();
  });

  it('Should return 404 when the polling queue is empty', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const query = {
      query: 'query GetUsers { users { name } }'
    };

    const response = await request(server).get('/').query(query);
    expect(response.statusCode).toBe(404);
  });
});

describe('createGraphQLRoutes: settings', () => {
  it('Should correctly delay response based on delay setting', async () => {
    const delay = 1000;
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const query = {
      query: 'query GetUsers { users { name } }'
    };
    const startTime = performance.now();
    const response = await request(server).get('/').query(query);
    const endTime = performance.now();

    expect(endTime - startTime).toBeGreaterThanOrEqual(delay);
    expect(response.body).toEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should correctly set status code of response based on status setting', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const query = {
      query: 'query GetUsers { users { name } }'
    };

    const response = await request(server).get('/').query(query);
    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should cycle through queue data with polling setting', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const query = {
      query: 'query GetUsers { users { name } }'
    };

    const firstResponse = await request(server).get('/').query(query);
    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toEqual({ name: 'John', surname: 'Doe' });

    const secondResponse = await request(server).get('/').query(query);
    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body).toEqual({ name: 'John', surname: 'Smith' });

    const thirdResponse = await request(server).get('/').query(query);
    expect(thirdResponse.statusCode).toBe(200);
    expect(thirdResponse.body).toEqual({ name: 'John', surname: 'Doe' });
  });
});

describe('createGraphQLRoutes: entities', () => {
  it('Should match route configuration when actual entities include specified properties', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const postResponse = await request(server)
      .post('/')
      .send({ query: 'query GetUsers { users { name } }' })
      .set({ key1: 'value1', key2: 'value2' })
      .query({ key1: 'value1', key2: 'value2' });

    expect(postResponse.statusCode).toBe(200);
    expect(postResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const getResponse = await request(server)
      .get('/')
      .set({ key1: 'value1', key2: 'value2' })
      .query({
        query: 'query GetUsers { users { name } }',
        key1: 'value1',
        key2: 'value2'
      });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should prioritize more specific route configuration when multiple matches exist', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const postResponse = await request(server)
      .post('/')
      .send({ query: 'query GetUsers { users { name } }' })
      .set({ key1: 'value1', key2: 'value2' })
      .query({ key1: 'value1', key2: 'value2' });

    expect(postResponse.statusCode).toBe(200);
    expect(postResponse.body).toStrictEqual({ name: 'John', surname: 'Smith' });

    const getResponse = await request(server)
      .get('/')
      .set({ key1: 'value1', key2: 'value2' })
      .query({
        query: 'query GetUsers { users { name } }',
        key1: 'value1',
        key2: 'value2'
      });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toStrictEqual({ name: 'John', surname: 'Smith' });
  });

  it('Should strictly compare variables if top level descriptor used', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
            routes: [
              {
                entities: {
                  variables: {
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

    const successPostResponse = await request(server)
      .post('/')
      .set('Content-Type', 'application/json')
      .send({
        query: 'query GetUsers { users { name } }',
        variables: {
          key1: 'value1',
          key2: { nestedKey1: 'nestedValue1' }
        }
      });
    expect(successPostResponse.statusCode).toBe(200);
    expect(successPostResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const failedPostResponse = await request(server)
      .post('/')
      .set('Content-Type', 'application/json')
      .send({
        query: 'query GetUsers { users { name } }',
        variables: {
          key1: 'value1',
          key2: { nestedKey1: 'nestedValue1', nestedKey2: 'nestedValue2' }
        }
      });
    expect(failedPostResponse.statusCode).toBe(404);

    const successGetResponse = await request(server)
      .get('/')
      .set('Content-Type', 'application/json')
      .query({
        query: 'query GetUsers { users { name } }',
        variables: '{ "key1": "value1", "key2": { "nestedKey1": "nestedValue1" } }'
      });
    expect(successGetResponse.statusCode).toBe(200);
    expect(successGetResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const failedGetResponse = await request(server)
      .get('/')
      .set('Content-Type', 'application/json')
      .query({
        query: 'query GetUsers { users { name } }',
        variables:
          '{ "key1": "value1", "key2": { "nestedKey1": "nestedValue1", "nestedKey2": "nestedValue2" } }'
      });
    expect(failedGetResponse.statusCode).toBe(404);
  });

  it('Should correctly resolve flat object variables with nested key matching', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
            routes: [
              {
                entities: {
                  variables: {
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

    const postResponse = await request(server)
      .post('/')
      .set('Content-Type', 'application/json')
      .send({
        query: 'query GetUsers { users { name } }',
        variables: {
          key1: { nestedKey1: 'nestedValue1' },
          key2: { nestedKey2: 'nestedValue2' }
        }
      });

    expect(postResponse.statusCode).toBe(200);
    expect(postResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const getResponse = await request(server)
      .get('/')
      .set('Content-Type', 'application/json')
      .query({
        query: 'query GetUsers { users { name } }',
        variables:
          '{ "key1": { "nestedKey1": "nestedValue1" }, "key2": { "nestedKey2": "nestedValue2" } }'
      });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });

  it('Should be case-insensitive for header keys', async () => {
    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
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

    const postResponse = await request(server)
      .post('/')
      .send({ query: 'query GetUsers { users { name } }' })
      .set({ LowerCase: 'lowercase', upperCase: 'UPPERCASE' });

    expect(postResponse.statusCode).toBe(200);
    expect(postResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });

    const getResponse = await request(server)
      .get('/')
      .set({ LowerCase: 'lowercase', upperCase: 'UPPERCASE' })
      .query({ query: 'query GetUsers { users { name } }' });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body).toStrictEqual({ name: 'John', surname: 'Doe' });
  });
});

describe('createGraphQLRoutes: interceptors', () => {
  it('Should call request interceptors in order: request -> route', async () => {
    const routeInterceptor = vi.fn();
    const requestInterceptor = vi.fn();

    const server = createServer({
      graphql: {
        configs: [
          {
            operationName: 'GetUsers',
            operationType: 'query',
            routes: [
              {
                entities: {
                  variables: {
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
            operationName: 'CreateUser',
            operationType: 'mutation',
            routes: [
              {
                entities: {
                  variables: {
                    name: 'John'
                  }
                },
                data: { name: 'John', surname: 'Smith' }
              }
            ]
          }
        ]
      }
    });

    await request(server).get('/').set('Content-Type', 'application/json').query({
      query: 'query GetUsers { users { name } }',
      variables: '{ "key1": "value1", "key2": "value2" }'
    });
    expect(requestInterceptor).toBeCalledTimes(1);
    expect(routeInterceptor).toBeCalledTimes(1);
    expect(requestInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
      routeInterceptor.mock.invocationCallOrder[0]
    );

    // ✅ important:
    // request interceptor called when operation type and operation name is matched even if server return 404
    await request(server).get('/').set('Content-Type', 'application/json').query({
      query: 'query GetUsers { users { name } }',
      variables: '{ "key3": "value3", "key4": "value4" }'
    });
    expect(requestInterceptor).toBeCalledTimes(2);
    expect(routeInterceptor).toBeCalledTimes(1);

    await request(server)
      .post('/')
      .set('Content-Type', 'application/json')
      .send({
        query: 'mutation CreateUser($name: String!) { createUser(name: $name) { name } }',
        variables: { name: 'John' }
      });
    expect(requestInterceptor).toBeCalledTimes(2);
    expect(routeInterceptor).toBeCalledTimes(1);
  });
});
