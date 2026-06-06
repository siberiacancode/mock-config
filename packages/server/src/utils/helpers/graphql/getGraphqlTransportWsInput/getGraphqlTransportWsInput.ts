import type { GraphqlTransportWsMessage } from '@/utils/types';

import { isPlainObject } from '../../isPlainObject/isPlainObject';

export const getGraphqlTransportWsInput = (message: string) => {
  try {
    const value = JSON.parse(message) as GraphqlTransportWsMessage;

    if (value.type === 'subscribe') {
      value.payload = {
        ...value.payload,
        variables: isPlainObject(value.payload?.variables) ? value.payload?.variables : undefined
      };
    }

    return value;
  } catch {
    return undefined;
  }
};
