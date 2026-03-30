import type { WsRouteConfig } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

export const calculateWsRouteConfigWeight = (wsRouteConfig: WsRouteConfig) => {
  const { entities } = wsRouteConfig;
  if (!entities) return 0;

  let routeConfigWeight = 0;
  const { payload } = entities;
  if (payload) {
    if (isPlainObject(payload) && payload.checkMode) {
      if (payload.checkMode === 'exists' || payload.checkMode === 'notExists') {
        routeConfigWeight += 1;
        return routeConfigWeight;
      }
      routeConfigWeight += isPlainObject(payload.value) ? Object.keys(payload.value).length : 1;
      return routeConfigWeight;
    }
    routeConfigWeight += isPlainObject(payload) ? Object.keys(payload).length : 1;
  }

  return routeConfigWeight;
};
