import type { RestDataResponseFunction, RestMethod, RestPollingItem } from '@/utils/types';

export const createPollingHandler = <Method extends RestMethod>(
  polling: RestPollingItem<Method>[]
): RestDataResponseFunction<Method> => {
  let pollingIndex = 0;
  let timeoutInProgress = false;

  const cyclePollingIndex = () => {
    const isLastIndex = pollingIndex === polling.length - 1;
    pollingIndex = isLastIndex ? 0 : pollingIndex + 1;
  };

  return async (params) => {
    if (!polling.length) {
      return params.next();
    }

    const pollingItem = polling[pollingIndex];

    if (pollingItem.time && !timeoutInProgress) {
      timeoutInProgress = true;
      setTimeout(() => {
        timeoutInProgress = false;
        cyclePollingIndex();
      }, pollingItem.time);
    }

    if (!pollingItem.time) {
      cyclePollingIndex();
    }

    return typeof pollingItem.data === 'function' ? pollingItem.data(params) : pollingItem.data;
  };
};
