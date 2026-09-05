import type { WsRouteConfig } from '@/utils/types';

import { isComparator, isPlainObject } from '@/utils/helpers';

const calculateEntityWeight = (entity: unknown) => {
  if (isComparator(entity) || !isPlainObject(entity)) return 1;
  return Object.keys(entity).length;
};

export const calculateWsRouteConfigWeight = (wsRouteConfig: WsRouteConfig) => {
  const entities = 'entities' in wsRouteConfig ? wsRouteConfig.entities : undefined;

  return Object.values(entities ?? {}).reduce<number>(
    (weight, entity) => weight + calculateEntityWeight(entity),
    0
  );
};
