import type { GraphQLDataResponseFunction, GraphQLPollingItem } from '@/utils/types';

export const createPollingHandler = (
  polling: GraphQLPollingItem[]
): GraphQLDataResponseFunction => {
  let pollingIndex = 0;
  let timeoutInProgress = false;

  const updatePollingIndex = () => {
    pollingIndex = polling.length - 1 === pollingIndex ? 0 : pollingIndex + 1;
  };

  return async (params) => {
    if (!polling.length) {
      return params.next() as any;
    }

    const pollingItem = polling[pollingIndex];

    if (pollingItem.time && !timeoutInProgress) {
      timeoutInProgress = true;
      setTimeout(() => {
        timeoutInProgress = false;
        updatePollingIndex();
      }, pollingItem.time);
    }

    if (!pollingItem.time) {
      updatePollingIndex();
    }

    return typeof pollingItem.data === 'function' ? pollingItem.data(params) : pollingItem.data;
  };
};
