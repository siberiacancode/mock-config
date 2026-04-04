import type { PlainObject } from '@/utils/types';

export interface GetGraphQLSubscriptionInputResult {
  query?: string;
  variables?: PlainObject;
}

export const getGraphQLSubscriptionInput = (
  value: Record<string, unknown>
): GetGraphQLSubscriptionInputResult => {
  const query = typeof value.query === 'string' ? value.query : undefined;
  const variables =
    typeof value.variables === 'object' && !!value.variables && !Array.isArray(value.variables)
      ? value.variables
      : undefined;

  return {
    query,
    variables
  };
};
