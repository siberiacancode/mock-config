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
  let pollingIndex = 0;
  let timeoutInProgress = false;

  const updatepollingIndex = () => {
    pollingIndex = polling.length - 1 === pollingIndex ? 0 : pollingIndex + 1;
  };

  return async (params) => {
    if (Array.isArray(polling) && !polling.length) {
      return params.next();
    }

    if (Array.isArray(polling)) {
      const pollingItem = polling[pollingIndex];

      if (pollingItem.time && !timeoutInProgress) {
        timeoutInProgress = true;
        setTimeout(() => {
          timeoutInProgress = false;
          updatepollingIndex();
        }, pollingItem.time);
      }

      if (!pollingItem.time) {
        updatepollingIndex();
      }

      return typeof pollingItem.data === 'function' ? pollingItem.data(params) : pollingItem.data;
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
