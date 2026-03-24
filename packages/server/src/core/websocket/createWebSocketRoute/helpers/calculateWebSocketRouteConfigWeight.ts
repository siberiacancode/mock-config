import type { MessagePlainEntity, WebSocketRouteConfig } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

const getMessageEntityWeight = (message: MessagePlainEntity) => {
  if (Array.isArray(message)) return 1;

  if (isPlainObject(message) && 'checkMode' in message) {
    if (message.checkMode === 'exists' || message.checkMode === 'notExists') {
      return 1;
    }

    if ('value' in message) {
      return isPlainObject(message.value) ? Object.keys(message.value).length : 1;
    }

    return 1;
  }

  return isPlainObject(message) ? Object.keys(message).length : 1;
};

export const calculateWebSocketRouteConfigWeight = (webSocketRouteConfig: WebSocketRouteConfig) => {
  const { entities } = webSocketRouteConfig;
  if (!entities) return 0;

  let routeConfigWeight = 0;
  const { headers, cookies, query, message } = entities;

  if (headers) routeConfigWeight += Object.keys(headers).length;
  if (cookies) routeConfigWeight += Object.keys(cookies).length;
  if (query) routeConfigWeight += Object.keys(query).length;
  if (message) routeConfigWeight += getMessageEntityWeight(message);

  return routeConfigWeight;
};

