import type { GraphQLWsProtocolMessage } from '@/utils/types';

export const getGraphQLWsProtocolInput = (message: string) => {
  let value: GraphQLWsProtocolMessage | undefined;
  try {
    value = JSON.parse(message) as GraphQLWsProtocolMessage;
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
