import type { WebSocket } from 'ws';

import color from 'ansi-colors';
import { getPort } from 'get-port-please';
import { WebSocketServer } from 'ws';

export const createWsServer = async () => {
  const port = await getPort({ port: 7811, random: true });
  const wss = new WebSocketServer({
    port
  });
  const wsClients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    wsClients.add(ws);
    console.log(color.green('✔'), 'Websocket client connected');
    ws.on('close', () => wsClients.delete(ws));
  });

  const getData = () => ({
    port,
    lastUpdated: Date.now()
  });

  const send = (value: string) => wsClients.forEach((wsClient) => wsClient.send(value));

  return {
    port,
    send,
    wss,
    getData
  };
};
