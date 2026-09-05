import type { WebSocketServer } from 'ws';

import { WebSocket } from 'ws';

import { sendWsData } from '../sendWsData/sendWsData';

export const broadcastWsData = (server: WebSocketServer, data: unknown) => {
  if (data === undefined) return;
  for (const client of server.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    sendWsData(client, data);
  }
};
