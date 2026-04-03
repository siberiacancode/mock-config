import type { RestMethod, RestRouteConfig } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

export const calculateRestRouteConfigWeight = (restRouteConfig: RestRouteConfig<RestMethod>) => {
  const { entities } = restRouteConfig;
  if (!entities) return 0;

  let routeConfigWeight = 0;
  const { headers, cookies, query, params, body } = entities;

  if (headers) routeConfigWeight += Object.keys(headers).length;
  if (cookies) routeConfigWeight += Object.keys(cookies).length;
  if (query) routeConfigWeight += Object.keys(query).length;
  if (params) routeConfigWeight += Object.keys(params).length;
  if (body) {
    if (isPlainObject(body) && body.checkMode) {
      // ✅ important:
      // check that actual value check modes does not have `value` for compare
      if (body.checkMode === 'exists' || body.checkMode === 'notExists') {
        routeConfigWeight += 1;
        return routeConfigWeight;
      }
      routeConfigWeight += isPlainObject(body.value) ? Object.keys(body.value).length : 1;
      return routeConfigWeight;
    }
    routeConfigWeight += isPlainObject(body) ? Object.keys(body).length : 1;
  }

  return routeConfigWeight;
};
