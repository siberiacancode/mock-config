import type { RestMethod, RestRouteConfig } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

export const calculateRestRouteConfigWeight = (restRouteConfig: RestRouteConfig<RestMethod>) => {
  const { entities } = restRouteConfig;
  if (!entities) return 0;

  let routeConfigWeight = 0;
  Object.values(entities).forEach((entityValue) => {
    routeConfigWeight += isPlainObject(entityValue) ? Object.keys(entityValue).length : 1;
  });

  return routeConfigWeight;
};
