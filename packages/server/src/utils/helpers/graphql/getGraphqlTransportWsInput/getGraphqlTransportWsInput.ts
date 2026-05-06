import type { GraphqlTransportWsMessage } from '@/utils/types';

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
    variables:
      typeof value.payload?.variables === 'object' &&
      !!value.payload?.variables &&
      !Array.isArray(value.payload?.variables)
        ? value.payload?.variables
        : undefined
  };

  return value;
};
