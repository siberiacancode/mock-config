import type { WebSocketRouteConfig } from "@/utils/types";

import { isPlainObject } from "@/utils/helpers";

export const calculateWebSocketRouteConfigWeight = (
  webSocketRouteConfig: WebSocketRouteConfig
) => {
  const { entities } = webSocketRouteConfig;
  if (!entities) return 0;

  let routeConfigWeight = 0;
  const { headers, cookies, query, message } = entities;

  if (headers) routeConfigWeight += Object.keys(headers).length;
  if (cookies) routeConfigWeight += Object.keys(cookies).length;
  if (query) routeConfigWeight += Object.keys(query).length;
  if (message) {
    if (isPlainObject(message) && message.checkMode) {
      // ✅ important:
      // check that actual value check modes does not have `value` for compare
      if (message.checkMode === "exists" || message.checkMode === "notExists") {
        routeConfigWeight += 1;
        return routeConfigWeight;
      }
      routeConfigWeight += isPlainObject(message.value)
        ? Object.keys(message.value).length
        : 1;
      return routeConfigWeight;
    }
    routeConfigWeight += isPlainObject(message)
      ? Object.keys(message).length
      : 1;
  }

  return routeConfigWeight;
};
