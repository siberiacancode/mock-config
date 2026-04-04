import type { GraphQLSubscriptionRouteConfig } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

export const calculateGraphQLSubscriptionRouteConfigWeight = (
  graphQLSubscriptionRouteConfig: GraphQLSubscriptionRouteConfig
) => {
  const { variables } = graphQLSubscriptionRouteConfig.entities ?? {};
  if (!variables) return 0;

  if ('checkMode' in variables && variables.checkMode) {
    if (variables.checkMode === 'exists' || variables.checkMode === 'notExists') {
      return 1;
    }
    return isPlainObject(variables.value) ? Object.keys(variables.value).length : 1;
  }

  return Object.keys(variables).length;
};
