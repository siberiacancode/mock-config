import type { AddressInfo } from 'ws';

import { once } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';

import type {
  BaseServerConfig,
  BaseUrl,
  GraphQLIdentifier,
  GraphQLTransportWsOperationType,
  GraphqlTransportWsRouteConfig,
  Interceptor,
  WsCloseRouteConfig,
  WsConnectionRouteConfig,
  WsDataResponse,
  WsErrorParams,
  WsRawRouteConfig,
  WsRequestArtifact
} from '@/utils/types';

import { ws as wsInterceptors } from '@/core/interceptors';
import { parseCookie, parseQuery, urlJoin } from '@/utils/helpers';

import { createWsRoute } from './createWsRoute';
import {
  calculateGraphqlTransportWsRouteConfigWeight,
  calculateWsRouteConfigWeight,
  prepareWsRequestArtifacts
} from './helpers';

export interface WsRawRequestConfig {
  routes: WsRawRouteConfig[];
  type: 'raw';
}

export interface WsConnectionRequestConfig {
  routes: WsConnectionRouteConfig[];
  type: 'connection';
}

export interface WsGraphqlTransportWsRequestConfig {
  identifier: GraphQLIdentifier;
  operationType: GraphQLTransportWsOperationType;
  routes: GraphqlTransportWsRouteConfig[];
  type: 'graphql-ws';
}

export interface WsCloseRequestConfig {
  routes: WsCloseRouteConfig[];
  type: 'close';
}

export interface WsErrorRequestConfig {
  routes: { data: (params: WsErrorParams) => unknown }[];
  type: 'error';
}

export type WsRequestConfig =
  | WsCloseRequestConfig
  | WsConnectionRequestConfig
  | WsErrorRequestConfig
  | WsGraphqlTransportWsRequestConfig
  | WsRawRequestConfig;

export interface WsConfig {
  baseUrl?: BaseUrl;
  configs: WsRequestConfig[];
  interceptors?: Interceptor[];
}

const clients: WebSocket[] = [];
const servers: WebSocketServer[] = [];

const createServer = async (
  mockServerConfig: Pick<BaseServerConfig, 'baseUrl' | 'interceptors'> & {
    ws: WsConfig;
  }
) => {
  const { baseUrl, ws } = mockServerConfig;
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });

  // ✅ important: contextMiddleware does it in real server, tests use bare WebSocketServer
  server.on('connection', (_socket, request) => {
    request.queries = parseQuery(request.url ?? '');
    request.cookies = parseCookie(request.headers.cookie ?? '');
  });

  createWsRoute({
    server,
    wsRequestArtifacts: prepareWsRequestArtifacts(
      ws.configs.reduce((acc, config) => {
        if ('type' in config && config.type === 'graphql-ws') {
          config.routes.forEach((route) => {
            acc.push({
              baseUrl: urlJoin(baseUrl ?? '/', ws.baseUrl ?? '/'),
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: config.identifier,
              config: route,
              weight: calculateGraphqlTransportWsRouteConfigWeight(route),
              componentInterceptors: ws.interceptors
            } as WsRequestArtifact);
          });

          return acc;
        }

        config.routes.forEach((route) => {
          acc.push({
            baseUrl: urlJoin(baseUrl ?? '/', ws.baseUrl ?? '/'),
            type: config.type,
            config: route,
            weight: calculateWsRouteConfigWeight(route),
            componentInterceptors: ws.interceptors
          } as WsRequestArtifact);
        });

        return acc;
      }, [] as WsRequestArtifact[])
    )
  });

  servers.push(server);

  await once(server, 'listening');

  return {
    port: (server.address() as AddressInfo).port,
    server
  };
};

const collectMessages = async (client: WebSocket, timeout = 100) => {
  const messages: unknown[] = [];
  client.on('message', (raw) => messages.push(JSON.parse(raw.toString())));
  await new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
  return messages;
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
      expect(JSON.parse(response.toString())).toStrictEqual({
        source: 'connection'
      });
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
      expect(JSON.parse(response.toString())).toStrictEqual({
        url: '/?room=public'
      });
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
      expect(JSON.parse(response.toString())).toStrictEqual({
        source: 'matched'
      });
    });

    it('Should use only first matched route configuration', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'connection',
              routes: [
                { data: () => ({ source: 'any' }) },
                {
                  entities: { queries: { room: 'public' } },
                  data: () => ({ source: 'specific' })
                }
              ]
            }
          ]
        }
      });
      const client = new WebSocket(`ws://127.0.0.1:${port}?room=public`);
      clients.push(client);
      const messagesPromise = collectMessages(client);
      await once(client, 'open');

      expect(await messagesPromise).toStrictEqual([{ source: 'specific' }]);
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
      expect(JSON.parse(response.toString())).toStrictEqual({
        source: 'matched'
      });
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
      expect(JSON.parse(response.toString())).toStrictEqual({
        message: 'hello'
      });
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

      expect(JSON.parse(firstResponse.toString())).toStrictEqual({
        message: 'hello'
      });
      expect(JSON.parse(secondResponse.toString())).toStrictEqual({
        message: 'hello'
      });
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
          interceptors: [
            wsInterceptors.request.message(componentRequestInterceptor),
            wsInterceptors.response.message(componentResponseInterceptor)
          ]
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

    it('Should provide frame to component interceptors', async () => {
      const componentRequestInterceptor = vi.fn();
      const componentResponseInterceptor = vi.fn((data) => data);

      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'raw',
              routes: [{ data: () => ({ source: 'raw' }) }]
            }
          ],
          interceptors: [
            wsInterceptors.request.message(componentRequestInterceptor),
            wsInterceptors.response.message(componentResponseInterceptor)
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(JSON.stringify({ event: 'ping' }));
      await once(client, 'message');

      const frame = {
        data: { event: 'ping' },
        isBinary: false,
        raw: '{"event":"ping"}'
      };
      expect(componentRequestInterceptor.mock.calls[0][0].frame).toStrictEqual(frame);
      expect(componentResponseInterceptor.mock.calls[0][1].frame).toStrictEqual(frame);
    });
  });

  describe('entities', () => {
    it('Should match route configuration by data entity', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'raw',
              routes: [
                {
                  entities: { data: { event: 'ping' } },
                  data: () => ({ source: 'ping' })
                }
              ]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(JSON.stringify({ event: 'ping' }));
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({ source: 'ping' });
    });

    it('Should not match route configuration when data entity is different', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'raw',
              routes: [
                {
                  entities: { data: { event: 'ping' } },
                  data: () => ({ source: 'ping' })
                }
              ]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);
      const messagesPromise = collectMessages(client);

      client.send(JSON.stringify({ event: 'pong' }));

      expect(await messagesPromise).toStrictEqual([]);
    });

    it('Should match route configuration by isBinary entity', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'raw',
              routes: [
                {
                  entities: { isBinary: true },
                  data: () => ({ source: 'binary' })
                },
                {
                  entities: { isBinary: false },
                  data: () => ({ source: 'text' })
                }
              ]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(Buffer.from(JSON.stringify({ event: 'ping' })));
      const [binaryResponse] = await once(client, 'message');
      expect(JSON.parse(binaryResponse.toString())).toStrictEqual({
        source: 'binary'
      });

      client.send(JSON.stringify({ event: 'ping' }));
      const [textResponse] = await once(client, 'message');
      expect(JSON.parse(textResponse.toString())).toStrictEqual({
        source: 'text'
      });
    });

    it('Should use only first matched route configuration', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'raw',
              routes: [
                { data: () => ({ source: 'any' }) },
                {
                  entities: { data: { event: 'ping' } },
                  data: () => ({ source: 'specific' })
                }
              ]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);
      const messagesPromise = collectMessages(client);

      client.send(JSON.stringify({ event: 'ping' }));

      expect(await messagesPromise).toStrictEqual([{ source: 'specific' }]);
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
      expect(JSON.parse(response.toString())).toStrictEqual({
        message: 'hello'
      });
    });
  });
});

describe('createWsRoute: ws.close', () => {
  describe('content', () => {
    it('Should correctly use data function with code and reason', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'close',
              routes: [{ data: ({ code, reason }) => ({ code, reason }) }]
            }
          ]
        }
      });
      // ✅ important: close response is broadcasted, closing client can not receive it
      const observer = await connectClient(`ws://127.0.0.1:${port}/`);
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const promise = once(observer, 'message');
      client.close(4000, 'user left');

      const [response] = await promise;
      expect(JSON.parse(response.toString())).toStrictEqual({
        code: 4000,
        reason: 'user left'
      });
    });
  });

  describe('entities', () => {
    it('Should match route configuration by code entity', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'close',
              routes: [
                {
                  entities: { code: 4000 },
                  data: () => ({ source: 'matched' })
                }
              ]
            }
          ]
        }
      });
      const observer = await connectClient(`ws://127.0.0.1:${port}/`);
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const promise = once(observer, 'message');
      client.close(4000, 'user left');

      const [response] = await promise;
      expect(JSON.parse(response.toString())).toStrictEqual({
        source: 'matched'
      });
    });

    it('Should not match route configuration when code entity is different', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'close',
              routes: [
                {
                  entities: { code: 4001 },
                  data: () => ({ source: 'matched' })
                }
              ]
            }
          ]
        }
      });
      const observer = await connectClient(`ws://127.0.0.1:${port}/`);
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const messagesPromise = collectMessages(observer);
      client.close(4000, 'user left');

      expect(await messagesPromise).toStrictEqual([]);
    });

    it('Should match route configuration by reason entity', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'close',
              routes: [
                {
                  entities: { reason: 'user left' },
                  data: () => ({ source: 'matched' })
                }
              ]
            }
          ]
        }
      });
      const observer = await connectClient(`ws://127.0.0.1:${port}/`);
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const promise = once(observer, 'message');
      client.close(4000, 'user left');

      const [response] = await promise;
      expect(JSON.parse(response.toString())).toStrictEqual({
        source: 'matched'
      });
    });

    it('Should use only first matched route configuration', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'close',
              routes: [
                { data: () => ({ source: 'any' }) },
                {
                  entities: { code: 4000 },
                  data: () => ({ source: 'specific' })
                }
              ]
            }
          ]
        }
      });
      const observer = await connectClient(`ws://127.0.0.1:${port}/`);
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const messagesPromise = collectMessages(observer);
      client.close(4000, 'user left');

      expect(await messagesPromise).toStrictEqual([{ source: 'specific' }]);
    });
  });

  describe('interceptors', () => {
    it('Should provide code and reason to component interceptors', async () => {
      const componentRequestInterceptor = vi.fn();
      const componentResponseInterceptor = vi.fn((data) => data);

      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'close',
              routes: [{ data: () => ({ source: 'close' }) }]
            }
          ],
          interceptors: [
            wsInterceptors.request.close(componentRequestInterceptor),
            wsInterceptors.response.close(componentResponseInterceptor)
          ]
        }
      });
      const observer = await connectClient(`ws://127.0.0.1:${port}/`);
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const promise = once(observer, 'message');
      client.close(4000, 'user left');
      await promise;

      expect(componentRequestInterceptor.mock.calls[0][0]).toMatchObject({
        code: 4000,
        reason: 'user left'
      });
      expect(componentResponseInterceptor.mock.calls[0][1]).toMatchObject({
        code: 4000,
        reason: 'user left'
      });
    });
  });
});

describe('createWsRoute: ws.error', () => {
  // ✅ important: text frame with invalid utf-8 is the simplest way to break the protocol
  const breakProtocol = (client: WebSocket) => {
    client.on('error', () => {});
    client.send(Buffer.from([0xff, 0xfe, 0xfd]), { binary: false });
  };

  describe('content', () => {
    it('Should correctly use data function with error', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'error',
              routes: [{ data: ({ error }) => ({ message: error.message }) }]
            }
          ]
        }
      });
      // ✅ important: socket is already closing on error, response is broadcasted
      const observer = await connectClient(`ws://127.0.0.1:${port}/`);
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const promise = once(observer, 'message');
      breakProtocol(client);

      const [response] = await promise;
      expect(JSON.parse(response.toString())).toStrictEqual({
        message: 'Invalid WebSocket frame: invalid UTF-8 sequence'
      });
    });
  });

  describe('interceptors', () => {
    it('Should provide error to component interceptors', async () => {
      const componentRequestInterceptor = vi.fn();

      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'error',
              routes: [{ data: () => ({ source: 'error' }) }]
            }
          ],
          interceptors: [wsInterceptors.request.error(componentRequestInterceptor)]
        }
      });
      const observer = await connectClient(`ws://127.0.0.1:${port}/`);
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      const promise = once(observer, 'message');
      breakProtocol(client);
      await promise;

      expect(componentRequestInterceptor.mock.calls[0][0].error).toBeInstanceOf(Error);
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
              routes: [{ data: { data: { ok: true } } }]
            }
          ]
        }
      });
      const client = await connectClient(`ws://127.0.0.1:${port}/`);

      client.send(JSON.stringify({ type: 'connection_init' }));
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        type: 'connection_ack'
      });
    });

    it('Should respond with pong for ping', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^Users$/,
              routes: [{ data: { data: { ok: true } } }]
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
              routes: [{ data: { data: { source: 'baseUrl' } } }]
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
        payload: { data: { source: 'baseUrl' } }
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
              routes: [{ data: { data: { source: 'operationName' } } }]
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
        payload: { data: { source: 'operationName' } }
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
              routes: [{ data: { data: { source: 'query' } } }]
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
        payload: { data: { source: 'query' } }
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
              routes: [{ data: { data: { source: 'queryRegExp' } } }]
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
        payload: { data: { source: 'queryRegExp' } }
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
              routes: [{ data: { data: { source: 'operationNameRegExp' } } }]
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
        payload: { data: { source: 'operationNameRegExp' } }
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
        payload: { data: { source: 'operationNameRegExp' } }
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
              routes: [{ data: { data: { source: 'query' } } }]
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
        payload: { data: { source: 'query' } }
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
              routes: [{ data: { data: { source: 'eventName' } } }]
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
        payload: { data: { source: 'eventName' } }
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
              routes: [{ data: { data: { source: 'eventNameRegExp' } } }]
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
        payload: { data: { source: 'eventNameRegExp' } }
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
                    next({ data: { source: 'push' } });
                    return { data: { source: 'push' } };
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
          payload: {
            query: 'subscription Users { users { id } }',
            operationName: 'Users'
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-next',
        type: 'next',
        payload: { data: { source: 'push' } }
      });
    });

    it('Should support params.complete from graphql subscription handler', async () => {
      const { port } = await createServer({
        ws: {
          configs: [
            {
              type: 'graphql-ws',
              operationType: 'subscription',
              identifier: /^Users$/,
              routes: [
                {
                  data: ({ complete }) => {
                    complete();
                    return { data: { source: 'should-not-send-next' } };
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
          id: 'sub-server-complete',
          type: 'subscribe',
          payload: {
            query: 'subscription Users { users { id } }',
            operationName: 'Users'
          }
        })
      );
      const [response] = await once(client, 'message');

      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-server-complete',
        type: 'complete'
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
                  data: { data: { ok: true } }
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
        payload: { data: { ok: true } }
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
                  data: { data: { ok: true } }
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
          payload: {
            query: 'subscription Users { users { id } }',
            operationName: 'Users'
          }
        })
      );
      const [response] = await once(client, 'message');
      const endTime = performance.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(delay - 5);
      expect(JSON.parse(response.toString())).toStrictEqual({
        id: 'sub-delay',
        type: 'next',
        payload: { data: { ok: true } }
      });
    });
  });
});
