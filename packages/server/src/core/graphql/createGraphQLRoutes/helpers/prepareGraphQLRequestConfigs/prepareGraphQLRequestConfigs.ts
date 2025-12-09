import type { GraphQLRequestConfig, GraphQLRouteConfig } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

const calculateRouteConfigWeight = (graphQLRouteConfig: GraphQLRouteConfig) => {
  const { entities } = graphQLRouteConfig;
  if (!entities) return 0;

  let routeConfigWeight = 0;
  const { headers, cookies, query, variables } = entities;

  if (headers) routeConfigWeight += Object.keys(headers).length;
  if (cookies) routeConfigWeight += Object.keys(cookies).length;
  if (query) routeConfigWeight += Object.keys(query).length;
  if (variables) {
    if (variables.checkMode) {
      // ✅ important:
      // check that actual value check modes does not have `value` for compare
      if (variables.checkMode === 'exists' || variables.checkMode === 'notExists') {
        routeConfigWeight += 1;
        return routeConfigWeight;
      }
      routeConfigWeight += isPlainObject(variables.value) ? Object.keys(variables.value).length : 1;
      return routeConfigWeight;
    }
    routeConfigWeight += Object.keys(variables).length;
  }

  return routeConfigWeight;
};

export const prepareGraphQLRequestConfigs = (requestConfigs: GraphQLRequestConfig[]) => {
  requestConfigs.forEach((requestConfig) => {
    requestConfig.routes.sort(
      (first, second) =>
        // ✅ important:
        // Lift more specific configs for correct working of routes
        calculateRouteConfigWeight(second) - calculateRouteConfigWeight(first)
    );
  });
  return requestConfigs;
};
