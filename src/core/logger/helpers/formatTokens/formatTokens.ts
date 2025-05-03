import type { PlainObject } from '@/utils/types';

import { formatTimestamp } from '@/utils/helpers';

export const formatTokens = (tokens: PlainObject) => {
  const { timestamp, method } = tokens;

  return {
    ...tokens,
    ...(timestamp && { timestamp: formatTimestamp(timestamp) }),
    ...(method && { method: method.toUpperCase() })
  };
};
