import type { WebSocket } from 'ws';

import type { GraphqlTransportWsExecutionResult } from '@/utils/types';

export const sendGraphqlTransportWsData = (
  socket: WebSocket,
  id: string,
  payload: GraphqlTransportWsExecutionResult
) => {
  if (payload === undefined) return;
  socket.send(JSON.stringify({ id, type: 'next', payload }));
};
