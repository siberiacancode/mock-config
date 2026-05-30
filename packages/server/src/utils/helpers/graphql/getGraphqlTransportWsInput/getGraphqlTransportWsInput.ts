import type { GraphqlTransportWsMessage } from '@/utils/types';

import { isPlainObject } from '../../isPlainObject/isPlainObject';

export const getGraphqlTransportWsInput = (message: string) => {
  let value: GraphqlTransportWsMessage | undefined;
  try {
    value = JSON.parse(message) as GraphqlTransportWsMessage;
  } catch {
    value = {
      type: 'subscribe'
    };
  }

  value.payload = {
    ...value.payload,
    variables: isPlainObject(value.payload?.variables) ? value.payload?.variables : undefined
  };

  return value;
};
