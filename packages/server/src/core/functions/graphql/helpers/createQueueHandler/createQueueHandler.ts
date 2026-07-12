import type {
  GraphQLDataResponseFunction,
  GraphQLPollingHandler,
  GraphQLPollingItem
} from '@/utils/types';

type GraphQLPolling = GraphQLPollingHandler | GraphQLPollingItem[];

export const createPollingHandler = (polling: GraphQLPolling): GraphQLDataResponseFunction => {
  let dynamicIterator: ReturnType<GraphQLPollingHandler> | null = null;
  let latestQueueItem: GraphQLPollingItem | undefined;
  let queueIndex = 0;
  let timeoutInProgress = false;

  const updateQueueIndex = () => {
    queueIndex = polling.length - 1 === queueIndex ? 0 : queueIndex + 1;
  };

  return async (params) => {
    if (Array.isArray(polling) && !polling.length) {
      return params.next() as any;
    }

    if (Array.isArray(polling)) {
      const queueItem = polling[queueIndex];

      if (queueItem.time && !timeoutInProgress) {
        timeoutInProgress = true;
        setTimeout(() => {
          timeoutInProgress = false;
          updateQueueIndex();
        }, queueItem.time);
      }

      if (!queueItem.time) {
        updateQueueIndex();
      }

      return typeof queueItem.data === 'function' ? queueItem.data(params) : queueItem.data;
    }

    if (!dynamicIterator) {
      dynamicIterator = polling(params);
    }

    const iteration = dynamicIterator.next(params);
    if (iteration.done) dynamicIterator = null;

    const queueItem = iteration.done ? (iteration.value ?? latestQueueItem) : iteration.value;

    if (!queueItem) {
      return params.next();
    }

    latestQueueItem = queueItem;

    return queueItem;
  };
};
