import type { GraphQLDataResponse, GraphQLDataResponseFunction } from '@/utils/types';

export const createQueueHandler = (
  normalizedQueue: { data: GraphQLDataResponse; time?: number }[]
): GraphQLDataResponseFunction => {
  let queueIndex = 0;
  let timeoutInProgress = false;

  const updateQueueIndex = () => {
    queueIndex = normalizedQueue.length - 1 === queueIndex ? 0 : queueIndex + 1;
  };

  return async (params) => {
    if (!normalizedQueue.length) {
      return params.next() as any;
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
