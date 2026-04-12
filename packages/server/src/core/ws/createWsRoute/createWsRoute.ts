import type { Express } from 'express';
import type { RawData, WebSocket } from 'ws';

import { WebSocketServer } from 'ws';

import type { WsParams, WsRequestArtifact } from '@/utils/types';

import { sleep, urlJoin } from '@/utils/helpers';

interface CreateWsRouteParams {
  server: Express;
  wsRequestArtifacts: WsRequestArtifact[];
}

const sendWsData = (socket: WebSocket, data: unknown) => {
  if (data === undefined) return;
  socket.send(typeof data === 'string' ? data : JSON.stringify(data));
};

export const createWsRoute = ({ server, wsRequestArtifacts }: CreateWsRouteParams) => {
  const wsServer = new WebSocketServer({
    noServer: true
  });

  const wsBaseUrls = new Set(wsRequestArtifacts.map((artifact) => urlJoin('/', artifact.baseUrl)));

  const originalListen = server.listen.bind(server);
  server.listen = ((...args: any[]) => {
    const httpServer = originalListen(...args);
    httpServer.on('upgrade', (request, socket, head) => {
      const shouldHandleUpgrade = wsBaseUrls.has(urlJoin('/', request.url ?? '/'));
      if (!shouldHandleUpgrade) {
        socket.destroy();
        return;
      }

      wsServer.handleUpgrade(request, socket, head, (upgradedSocket) => {
        wsServer.emit('connection', upgradedSocket, request);
      });
    });
    return httpServer;
  }) as typeof server.listen;

  wsServer.on('connection', (socket) => {
    socket.on('message', async (raw: RawData) => {
      const params: WsParams = {
        raw,
        socket,
        send: (data: unknown) => sendWsData(socket, data),
        setDelay: async (delay) => {
          await sleep(delay === Infinity ? 99999999 : delay);
        }
      };

      for (const artifact of wsRequestArtifacts) {
        if (artifact.componentRequestInterceptor) {
          await artifact.componentRequestInterceptor(params);
        }

        const resolvedData = await artifact.config.data(params);

        const data = artifact.componentResponseInterceptor
          ? artifact.componentResponseInterceptor(resolvedData, params)
          : resolvedData;

        sendWsData(socket, data);
      }
    });
  });
};
