import type { AddressInfo } from 'ws';

import { once } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';

import type { BaseServerConfig, WsConfig, WsDataResponse, WsRequestArtifact } from '@/utils/types';

import { urlJoin } from '@/utils/helpers';

import { createWsRoute } from './createWsRoute';

const clients: WebSocket[] = [];
const servers: WebSocketServer[] = [];

const createServer = async (
  mockServerConfig: Pick<BaseServerConfig, 'baseUrl' | 'interceptors'> & {
    ws: WsConfig;
  }
) => {
  const { baseUrl, ws } = mockServerConfig;
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });

  createWsRoute({
    server,
    wsRequestArtifacts: ws.configs.reduce((acc, config) => {
      if ('type' in config && config.type === 'graphql-ws') {
        config.routes.forEach((route) => {
          acc.push({
            baseUrl: urlJoin(baseUrl ?? '/', ws.baseUrl ?? '/'),
            type: 'graphql-ws',
            operationType: 'subscription',
            identifier: config.identifier,
            config: route,
            weight: 0
          } as WsRequestArtifact);
        });

        return acc;
      }

      config.routes.forEach((route) => {
        acc.push({
          baseUrl: urlJoin(baseUrl ?? '/', ws.baseUrl ?? '/'),
          type: config.type,
          config: route,
          weight: 0,
          componentRequestInterceptor: ws.interceptors?.request,
          componentResponseInterceptor: ws.interceptors?.response
        } as WsRequestArtifact);
      });

      return acc;
    }, [] as WsRequestArtifact[])
  });

  servers.push(server);

  await once(server, 'listening');

  return {
    port: (server.address() as AddressInfo).port,
    server
  };
};

const connectClient = async (url: string, headers?: Record<string, string>) => {
  const client = new WebSocket(url, { headers });
  await once(client, 'open');
  clients.push(client);
  return client;
};

afterEach(async () => {
  await Promise.all(
    clients.splice(0).map(
      (client) =>
        new Promise<void>((resolve) => {
          if (client.readyState === WebSocket.CLOSED) {
            resolve();
            return;
          }

          client.once('close', () => resolve());
          client.close();
        })
    )
  );

  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        })
    )
  );
});

describe('createWsRoute: ws.connection', () => {
  describe('routing', () => {
    it('Should match route configuration by baseUrl', async () => {
      const { port } = await createServer({
        ws: {
          baseUrl: '/connection',
          configs: [
            {
              type: 'connection',
              routes: [{ data: () => ({ source: 'connection' }) }]
            }
          ]
        }
      });
      const client = new WebSocket(`ws://127.0.0.1:${port}/connection`);
      clients.push(client);
      const promise = once(client, 'message');
      await once(client, 'open');

      const [response] = await promise;
      expect(JSON.parse(response.toString())).toStrictEqual({ source: 'connection' });
    });
  });

  describe('content', () => {
    it('Should correctly use data function', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'connection',
              routes: [
                {
                  data: ({ request }) => ({
                    url: request.url
                  })
                }
              ]
            }
          ]
        }
      });
      const client = new WebSocket(`ws://127.0.0.1:${port}/?room=public`);
      clients.push(client);
      const promise = once(client, 'message');
      await once(client, 'open');

      const [response] = await promise;
      expect(JSON.parse(response.toString())).toStrictEqual({ url: '/?room=public' });
    });
  });

  describe('entities', () => {
    it('Should match route configuration when actual entities include specified properties', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'connection',
              routes: [
                {
                  entities: {
                    headers: {
                      key1: 'value1',
                      key2: 'value2'
                    },
                    queries: { room: 'public' }
                  },
                  data: () => ({ source: 'matched' })
                }
              ]
            }
          ]
        }
      });
      const client = new WebSocket(`ws://127.0.0.1:${port}?room=public&extra=value`, {
        headers: {
          key1: 'value1',
          key2: 'value2'
        }
      });
      clients.push(client);
      const promise = once(client, 'message');
      await once(client, 'open');

      const [response] = await promise;
      expect(JSON.parse(response.toString())).toStrictEqual({ source: 'matched' });
    });

    it('Should be case-insensitive for header keys', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'connection',
              routes: [
                {
                  entities: {
                    headers: {
                      lowercase: 'lowercase',
                      UPPERCASE: 'UPPERCASE'
                    }
                  },
                  data: () => ({ source: 'matched' })
                }
              ]
            }
          ]
        }
      });
      const client = new WebSocket(`ws://127.0.0.1:${port}/`, {
        headers: {
          LowerCase: 'lowercase',
          upperCase: 'UPPERCASE'
        }
      });
      clients.push(client);
      const promise = once(client, 'message');
      await once(client, 'open');

      const [response] = await promise;
      expect(JSON.parse(response.toString())).toStrictEqual({ source: 'matched' });
    });
  });
});

describe('createWsRoute: ws.raw', () => {
  describe('routing', () => {
    it('Should match route configuration by baseUrl', async () => {
      const { port } = await createServer({
        ws: {
          baseUrl: '/raw',
          configs: [
            {
              type: 'raw',
              routes: [{ data: (() => ({ source: 'raw' })) as WsDataResponse }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/raw`);

      client.send('hello');
      const [response] = await once(client, 'message');
      expect(JSON.parse(response.toString())).toStrictEqual({ source: 'raw' });
    });
  });

  describe('content', () => {
    it('Should correctly use data function for message', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'raw',
              routes: [{ data: (({ raw }) => ({ message: raw })) as WsDataResponse }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send('hello');
      const [response] = await once(client, 'message');
      expect(JSON.parse(response.toString())).toStrictEqual({ message: 'hello' });
    });

    it('Should broadcast message to all connected clients', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'raw',
              routes: [
                {
                  data: (({ broadcast, raw }) => {
                    broadcast({ message: raw });
                  }) as WsDataResponse
                }
              ]
            }
          ]
        }
      });
      const firstClient = await connectClient(`ws://127.0.0.1:${port}/`);
      const secondClient = await connectClient(`ws://127.0.0.1:${port}/`);

      firstClient.send('hello');

      const [firstResponse] = await once(firstClient, 'message');
      const [secondResponse] = await once(secondClient, 'message');

      expect(JSON.parse(firstResponse.toString())).toStrictEqual({ message: 'hello' });
      expect(JSON.parse(secondResponse.toString())).toStrictEqual({ message: 'hello' });
    });
  });

  describe('interceptors', () => {
    it('Should call component interceptors in order: request -> response', async () => {
      const componentRequestInterceptor = vi.fn();
      const componentResponseInterceptor = vi.fn((data) => ({
        ...(data as Record<string, unknown>),
        intercepted: true
      }));

      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'raw',
              routes: [{ data: () => ({ source: 'raw' }) }]
            }
          ],
          interceptors: {
            request: componentRequestInterceptor,
            response: componentResponseInterceptor
          }
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send('hello');
      const [response] = await once(client, 'message');

      expect(componentRequestInterceptor).toBeCalledTimes(1);
      expect(componentResponseInterceptor).toBeCalledTimes(1);
      expect(componentRequestInterceptor.mock.invocationCallOrder[0]).toBeLessThan(
        componentResponseInterceptor.mock.invocationCallOrder[0]
      );
      expect(JSON.parse(response.toString())).toStrictEqual({
        source: 'raw',
        intercepted: true
      });
    });
  });

  describe('settings', () => {
    it('Should delay raw response by route setting', async () => {
      const delay = 100;
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'raw',
              routes: [
                {
                  settings: { delay },
                  data: (({ raw }) => ({ message: raw })) as WsDataResponse
                }
              ]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const startTime = performance.now();
      client.send('hello');
      const [response] = await once(client, 'message');
      const endTime = performance.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(delay);
      expect(JSON.parse(response.toString())).toStrictEqual({ message: 'hello' });
    });
  });
});

describe('createWsRoute: ws.graphql-transport-ws', () => {
  describe('protocol', () => {
    it('Should acknowledge connection_init', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^Users$/,
              routes: [{ data: { ok: true } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(JSON.stringify({ type: 'connection_init' }));
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({ type: 'connection_ack' });
    });

    it('Should respond with pong for ping', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^Users$/,
              routes: [{ data: { ok: true } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(JSON.stringify({ type: 'ping' }));
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({ type: 'pong' });
    });
  });

  describe('routing', () => {
    it('Should match route configuration by baseUrl', async () => {
      const { port } = await createServer({
        ws: {
          baseUrl: '/graphql',
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^UsersByBaseUrl$/,
              routes: [{ data: { source: 'baseUrl' } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/graphql`);

      client.send(
        JSON.stringify({
          id: 'sub-base-url',
          type: 'subscribe',
          payload: {
            query: 'subscription UsersByBaseUrl { users { id } }',
            operationName: 'UsersByBaseUrl'
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-base-url',
        type: 'next',
        payload: { source: 'baseUrl' }
      });
    });

    it('Should match config with operationName', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: 'UsersByOperation',
              routes: [{ data: { source: 'operationName' } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(
        JSON.stringify({
          id: 'sub-operation-name',
          type: 'subscribe',
          payload: {
            query: 'subscription UsersByOperation { users { id } }',
            operationName: 'UsersByOperation'
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-operation-name',
        type: 'next',
        payload: { source: 'operationName' }
      });
    });

    it('Should match config with query', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: 'subscription UsersByQuery { users { id } }',
              routes: [{ data: { source: 'query' } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(
        JSON.stringify({
          id: 'sub-query',
          type: 'subscribe',
          payload: {
            query: 'subscription UsersByQuery { users { id } }',
            operationName: 'AnotherName'
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-query',
        type: 'next',
        payload: { source: 'query' }
      });
    });

    it('Should match config with query regExp', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^subscription\s+UsersByQuery\{users\{id\}\}$/,
              routes: [{ data: { source: 'queryRegExp' } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(
        JSON.stringify({
          id: 'sub-query-regexp',
          type: 'subscribe',
          payload: {
            query: 'subscription UsersByQuery { users { id } }',
            operationName: 'AnotherName'
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-query-regexp',
        type: 'next',
        payload: { source: 'queryRegExp' }
      });
    });

    it('Should match config with operationName regExp', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^UsersBy(.+)$/g,
              routes: [{ data: { source: 'operationNameRegExp' } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(
        JSON.stringify({
          id: 'sub-operation-name-regexp-1',
          type: 'subscribe',
          payload: {
            query: 'subscription UsersByOperation { users { id } }',
            operationName: 'UsersByOperation'
          }
        })
      );
      const [firstResponse] = await once(client, 'message');

      expect(JSON.parse(firstResponse.toString())).toStrictEqual({
        id: 'sub-operation-name-regexp-1',
        type: 'next',
        payload: { source: 'operationNameRegExp' }
      });

      client.send(
        JSON.stringify({
          id: 'sub-operation-name-regexp-2',
          type: 'subscribe',
          payload: {
            query: 'subscription UsersByAnotherOperation { users { id } }',
            operationName: 'UsersByAnotherOperation'
          }
        })
      );
      const [secondResponse] = await once(client, 'message');

      expect(JSON.parse(secondResponse.toString())).toStrictEqual({
        id: 'sub-operation-name-regexp-2',
        type: 'next',
        payload: { source: 'operationNameRegExp' }
      });
    });

    it('Should match config with query independent of spaces and new lines', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: 'subscription UsersByQuery { users { id } }',
              routes: [{ data: { source: 'query' } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(
        JSON.stringify({
          id: 'sub-query',
          type: 'subscribe',
          payload: {
            query: 'subscription  UsersByQuery  {  users  {  id  }  }',
            operationName: 'AnotherName'
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-query',
        type: 'next',
        payload: { source: 'query' }
      });
    });

    it('Should match config with eventName', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: 'users',
              routes: [{ data: { source: 'eventName' } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(
        JSON.stringify({
          id: 'sub-event-name',
          type: 'subscribe',
          payload: {
            query: 'subscription UsersByEventName { users { id } }',
            operationName: 'AnotherName'
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-event-name',
        type: 'next',
        payload: { source: 'eventName' }
      });
    });

    it('Should match config with eventName regExp', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^us(.+?)s$/,
              routes: [{ data: { source: 'eventNameRegExp' } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(
        JSON.stringify({
          id: 'sub-event-name-regexp',
          type: 'subscribe',
          payload: {
            query: 'subscription UsersByEventName { users { id } }',
            operationName: 'AnotherName'
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-event-name-regexp',
        type: 'next',
        payload: { source: 'eventNameRegExp' }
      });
    });
  });

  describe('content', () => {
    it('Should support params.next from graphql subscription handler', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^Users$/,
              routes: [
                {
                  data: ({ next }) => {
                    next({ source: 'push' });
                    return undefined;
                  }
                }
              ]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(
        JSON.stringify({
          id: 'sub-next',
          type: 'subscribe',
          payload: { query: 'subscription Users { users { id } }', operationName: 'Users' }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-next',
        type: 'next',
        payload: { source: 'push' }
      });
    });
  });

  describe('entities', () => {
    it('Should match graphql subscription route by variables entities', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^Users$/,
              routes: [
                {
                  entities: {
                    variables: { room: 'public' }
                  },
                  data: { ok: true }
                }
              ]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(
        JSON.stringify({
          id: 'sub-entities',
          type: 'subscribe',
          payload: {
            query: 'subscription Users { users { id } }',
            operationName: 'Users',
            variables: { room: 'public' }
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-entities',
        type: 'next',
        payload: { ok: true }
      });
    });
  });

  describe('settings', () => {
    it('Should delay graphql subscription response by route setting', async () => {
      const delay = 100;
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^Users$/,
              routes: [
                {
                  settings: { delay },
                  data: { ok: true }
                }
              ]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const startTime = performance.now();
      client.send(
        JSON.stringify({
          id: 'sub-delay',
          type: 'subscribe',
          payload: { query: 'subscription Users { users { id } }', operationName: 'Users' }
        })
      );
      const [response] = await once(client, 'message');
      const endTime = performance.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(delay - 5);
      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-delay',
        type: 'next',
        payload: { ok: true }
      });
    });
  });
});
