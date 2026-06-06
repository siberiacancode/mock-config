import type {
  NativeRestDataResponse,
  NativeRestDataResponseFunction
} from 'src/server/createNativeMockServer/types';

import { next } from 'src/server/createNativeMockServer/helpers/routes';

export const createQueueHandler = (
  queue: { data: NativeRestDataResponse; time?: number }[]
): NativeRestDataResponseFunction => {
  let queueIndex = 0;
  let timeoutInProgress = false;

  const updateQueueIndex = () => {
    queueIndex = queue.length - 1 === queueIndex ? 0 : queueIndex + 1;
  };

  return (params) => {
    if (!queue.length) {
      throw next();
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
