import type { AddressInfo } from 'ws';

import { once } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';

import type { BaseServerConfig, WsConfig, WsRequestArtifact } from '@/utils/types';

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

describe('createWsRoute: routing', () => {
  it('Should match route configuration by baseUrl for ws.connection', async () => {
    const { port } = await createServer({
      ws: {
        configs: [
          {
            type: 'connection',
            routes: [{ data: () => ({ source: 'connection' }) }]
          }
        ]
      }
    });
    const client = new WebSocket(`ws://127.0.0.1:${port}`);
    clients.push(client);
    const promise = once(client, 'message');
    await once(client, 'open');

    const [response] = await promise;
    expect(JSON.parse(response.toString())).toStrictEqual({ source: 'connection' });
  });
});

describe('createWsRoute: content', () => {
  it('Should correctly use data function for ws.message', async () => {
    const { port } = await createServer({
      ws: {
        configs: [
          {
            type: 'raw',
            routes: [{ data: ({ raw }) => ({ message: raw }) }]
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
                data: ({ broadcast, raw }) => {
                  broadcast({ message: raw });
                }
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

describe('createWsRoute: entities', () => {
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
                  query: {
                    room: 'public'
                  }
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

describe('createWsRoute: interceptors', () => {
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
