import type { GraphqlDataResponse, GraphqlDataResponseFunction } from '@/utils/types';

export const createQueueHandler = (
  normalizedQueue: { data: GraphqlDataResponse; time?: number }[]
): GraphqlDataResponseFunction => {
  let queueIndex = 0;
  let timeoutInProgress = false;

  const updateQueueIndex = () => {
    queueIndex = normalizedQueue.length - 1 === queueIndex ? 0 : queueIndex + 1;
  };

  return async (params) => {
    if (!normalizedQueue.length) {
      return params.next();
    }

    const queueItem = normalizedQueue[queueIndex];
    const { time } = queueItem;

    if (time && !timeoutInProgress) {
      timeoutInProgress = true;
      setTimeout(() => {
        timeoutInProgress = false;
        updateQueueIndex();
      }, time);
    }

    if (!time) {
      updateQueueIndex();
    }

    return typeof queueItem.data === 'function' ? queueItem.data(params) : queueItem.data;
  };
};
