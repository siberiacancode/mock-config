import type { GraphQLRequestConfig, GraphQLRouteConfig } from '@/utils/types';

import { checkModeSymbol } from '@/utils/constants';
import { isPlainObject } from '@/utils/helpers';

const calculateRouteConfigWeight = (graphQLRouteConfig: GraphQLRouteConfig) => {
  const { entities } = graphQLRouteConfig;
  if (!entities) return 0;

  let routeConfigWeight = 0;
  const { headers, cookies, queries, variables } = entities;

  if (headers) routeConfigWeight += Object.keys(headers).length;
  if (cookies) routeConfigWeight += Object.keys(cookies).length;
  if (queries) routeConfigWeight += Object.keys(queries).length;
  if (variables) {
    if (variables[checkModeSymbol]) {
      // ✅ important:
      // check that actual value check modes does not have `value` for compare
      if (variables[checkModeSymbol] === 'exists' || variables[checkModeSymbol] === 'notExists') {
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
