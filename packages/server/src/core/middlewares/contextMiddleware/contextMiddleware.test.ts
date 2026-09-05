import type { AddressInfo } from 'ws';

import express from 'express';
import { Buffer } from 'node:buffer';
import { once } from 'node:events';
import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';

import type { WsSocket } from '@/utils/types';

import { contextMiddleware } from './contextMiddleware';

const servers: WebSocketServer[] = [];
const clients: WebSocket[] = [];

const createServer = async () => {
  const ws = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  servers.push(ws);

  const server = express();
  contextMiddleware(server, { ws });

  await once(ws, 'listening');

  return { server, ws };
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

describe('contextMiddleware: request context', () => {
  it('Should not leak arbitrary context data between requests', async () => {
    const { server } = await createServer();
    server.use((request, response) => {
      request.context.visits = (request.context.visits ?? 0) + 1;
      response.json({ visits: request.context.visits });
    });

    expect((await supertest(server).get('/')).body).toStrictEqual({ visits: 1 });
    expect((await supertest(server).get('/')).body).toStrictEqual({ visits: 1 });
  });

  it('Should share orm and broadcast between requests', async () => {
    const { server } = await createServer();
    const broadcasts: unknown[] = [];
    server.use((request, response) => {
      broadcasts.push(request.context.broadcast);
      response.json({ hasOrm: !!request.context.orm });
    });

    await supertest(server).get('/');
    await supertest(server).get('/');

    expect(broadcasts[0]).toBe(broadcasts[1]);
  });

  it('Should assign increasing id and timestamp to each request', async () => {
    const { server } = await createServer();
    server.use((request, response) => {
      response.json({ id: request.id, timestamp: request.timestamp });
    });

    const first = (await supertest(server).get('/')).body;
    const second = (await supertest(server).get('/')).body;

    expect(second.id).toBe(first.id + 1);
    expect(typeof first.timestamp).toBe('number');
  });
});

describe('contextMiddleware: socket context', () => {
  const connectSocket = async (ws: WebSocketServer) => {
    const connectionPromise = once(ws, 'connection');
    const client = new WebSocket(`ws://127.0.0.1:${(ws.address() as AddressInfo).port}`);
    clients.push(client);
    const [socket] = (await connectionPromise) as [WsSocket];
    // ✅ important: server connection event fires while the client is still CONNECTING,
    // closing it at that point throws "WebSocket was closed before the connection was established"
    await once(client, 'open');
    return socket;
  };

  it('Should assign connection scoped id, timestamp and empty context', async () => {
    const { ws } = await createServer();

    const socket = await connectSocket(ws);

    expect(socket.id).toBe(1);
    expect(typeof socket.timestamp).toBe('number');
    expect(socket.context).toStrictEqual({});
  });

  it('Should not share context between connections', async () => {
    const { ws } = await createServer();

    const firstSocket = await connectSocket(ws);
    firstSocket.context.room = 'public';
    const secondSocket = await connectSocket(ws);

    expect(secondSocket.id).toBe(2);
    expect(secondSocket.context).toStrictEqual({});
  });

  it('Should not mutate socket fields on message, close and error events', async () => {
    const { ws } = await createServer();

    const socket = await connectSocket(ws);
    const { id, timestamp } = socket;

    const messagePromise = once(socket, 'message');
    socket.emit('message', Buffer.from('hello'), false);
    await messagePromise;

    expect(socket.id).toBe(id);
    expect(socket.timestamp).toBe(timestamp);
  });
});
