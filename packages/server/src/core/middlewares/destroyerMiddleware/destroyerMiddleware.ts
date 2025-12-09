import type { Server } from 'node:http';
import type { Socket } from 'node:net';

type ServerWithDestroyer = Server & { destroy: Server['close'] };

export const destroyerMiddleware = (server: Server): ServerWithDestroyer => {
  const serverWithDestroyer = server as ServerWithDestroyer;
  const connections: Record<string, Socket> = {};

  serverWithDestroyer.on('connection', (connection) => {
    const key = `${connection.remoteAddress}:${connection.remotePort}`;
    connections[key] = connection;
    connection.on('close', () => {
      delete connections[key];
    });
  });

  serverWithDestroyer.destroy = (callback) => {
    serverWithDestroyer.close(callback);
    Object.values(connections).forEach((connection) => {
      connection.destroy();
    });
    return serverWithDestroyer;
  };

  return serverWithDestroyer;
};
