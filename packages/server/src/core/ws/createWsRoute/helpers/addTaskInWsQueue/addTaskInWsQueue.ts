import type { WebSocket } from 'ws';

import type { MaybePromise } from '@/utils/types';

const WS_TASK_QUEUE = Symbol.for('wsTaskQueue');

type WebSocketWithQueue = WebSocket & { [WS_TASK_QUEUE]?: Promise<void> };

export const addTaskInWsQueue = (webSocket: WebSocket, task: () => MaybePromise<void>) => {
  const webSocketWithQueue = webSocket as WebSocketWithQueue;

  const chain = (webSocketWithQueue[WS_TASK_QUEUE] ?? Promise.resolve())
    .then(task)
    .catch((error) => {
      console.error('[mock-server] ws task failed', error);
    });

  webSocketWithQueue[WS_TASK_QUEUE] = chain;

  return chain;
};
