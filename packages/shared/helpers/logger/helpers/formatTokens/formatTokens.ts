import type { PlainObject } from '@/shared/types';

import { formatTimestamp } from '../../../date';

export const formatTokens = (tokens: PlainObject) => {
  const { timestamp, method } = tokens;

  return {
    ...tokens,
    ...(timestamp && { timestamp: formatTimestamp(timestamp) }),
    ...(method && { method: method.toUpperCase() })
  };
};
