import type { WebSocket } from 'ws';

/**
 * Symbol.for, а не обычный Symbol — чтобы очередь оставалась одной и той же
 * даже если модуль продублируется (HMR, две копии пакета в node_modules).
 */
const WS_TASK_QUEUE = Symbol.for('mockServer.wsTaskQueue');

type QueueHolder = WebSocket & { [WS_TASK_QUEUE]?: Promise<void> };

/**
 * Ставит задачу в общую для сокета очередь и возвращает промис её завершения.
 *
 * Задачи выполняются строго последовательно, в порядке постановки. Поэтому
 * вызывать enqueueWsTask нужно СИНХРОННО из обработчика события — до любого
 * await. Порядок вызовов enqueueWsTask и есть порядок выполнения.
 *
 *   ws.on('connection', (socket) => {
 *     enqueueWsTask(socket, async () => { ... });  // серверные интерцепторы
 *   });
 *
 * Ошибка одной задачи не рвёт очередь: следующие всё равно выполнятся.
 */
export const enqueueWsTask = (
  socket: WebSocket,
  task: () => Promise<void> | void
): Promise<void> => {
  const holder = socket as QueueHolder;

  const chain = (holder[WS_TASK_QUEUE] ?? Promise.resolve()).then(task).catch((error) => {
    console.error('[mock-server] ws task failed', error);
  });

  holder[WS_TASK_QUEUE] = chain;

  return chain;
};

/** Дождаться, пока сокет доработает всё, что накопилось. Удобно в тестах. */
export const flushWsTasks = (socket: WebSocket): Promise<void> =>
  (socket as QueueHolder)[WS_TASK_QUEUE] ?? Promise.resolve();
