import type { WebSocket } from 'ws';

export const sendGraphqlTransportWsComplete = (socket: WebSocket, id: string) => {
  socket.send(JSON.stringify({ id, type: 'complete' }));
};
