import type { WsRouteConfig } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

export const calculateWsRouteConfigWeight = (wsRouteConfig: WsRouteConfig) => {
  const entities = 'entities' in wsRouteConfig ? wsRouteConfig.entities : undefined;
  if (!entities) return 0;

  let routeConfigWeight = 0;
  Object.values(entities).forEach((entityValue) => {
    routeConfigWeight += isPlainObject(entityValue) ? Object.keys(entityValue).length : 1;
  });

  return routeConfigWeight;
};
