import type {
  GraphQLDataResponseFunction,
  GraphQLPollingHandler,
  GraphQLPollingItem
} from '@/utils/types';

type GraphQLPolling = GraphQLPollingHandler | GraphQLPollingItem[];

export const createPollingHandler = (polling: GraphQLPolling): GraphQLDataResponseFunction => {
  let dynamicIterator: ReturnType<GraphQLPollingHandler> | null = null;
  let latestpollingItem: GraphQLPollingItem | undefined;
  let pollingIndex = 0;
  let timeoutInProgress = false;

  const updatepollingIndex = () => {
    pollingIndex = polling.length - 1 === pollingIndex ? 0 : pollingIndex + 1;
  };

  return async (params) => {
    if (Array.isArray(polling) && !polling.length) {
      return params.next() as any;
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

    const pollingItem = iteration.done ? (iteration.value ?? latestpollingItem) : iteration.value;

    if (!pollingItem) {
      return params.next();
    }

    latestpollingItem = pollingItem;

    return pollingItem;
  };
};
