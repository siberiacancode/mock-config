import type {
  RestDataResponseFunction,
  RestMethod,
  RestPollingHandler,
  RestPollingItem
} from '@/utils/types';

type RestPolling<Method extends RestMethod> =
  | RestPollingHandler<Method>
  | RestPollingItem<Method>[];

export const createPollingHandler = <Method extends RestMethod>(
  polling: RestPolling<Method>
): RestDataResponseFunction<Method> => {
  let dynamicIterator: ReturnType<RestPollingHandler<Method>> | null = null;
  let latestPolling: RestPollingItem<Method> | undefined;
  let queueIndex = 0;
  let timeoutInProgress = false;

  const updateQueueIndex = () => {
    queueIndex = polling.length - 1 === queueIndex ? 0 : queueIndex + 1;
  };

  return async (params) => {
    if (Array.isArray(polling) && !polling.length) {
      return params.next();
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

    const item = iteration.done ? (iteration.value ?? latestPolling) : iteration.value;

    if (!item) {
      return params.next();
    }

    latestPolling = item;

    return item;
  };
};
