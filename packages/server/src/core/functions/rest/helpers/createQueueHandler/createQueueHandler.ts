import type { RestDataResponse, RestDataResponseFunction, RestMethod } from '@/utils/types';

export const createQueueHandler = <Method extends RestMethod>(
  queue: { data: RestDataResponse<Method>; time?: number }[]
): RestDataResponseFunction<Method> => {
  let queueIndex = 0;
  let timeoutInProgress = false;

  const updateQueueIndex = () => {
    queueIndex = queue.length - 1 === queueIndex ? 0 : queueIndex + 1;
  };

  return async (params) => {
    if (!queue.length) {
      return params.next();
    }

    const queueItem = queue[queueIndex];
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
