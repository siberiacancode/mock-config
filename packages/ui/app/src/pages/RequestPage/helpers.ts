import {
  formatComparator,
  formatComparatorArguments,
  getComparatorFunctionSources,
  isSerializedComparator,
  isSerializedFunction
} from '@/utils/helpers';

import type { SendTarget } from './components/SendRequestDrawer/types';
import type { RouteEntry, RouteMatcher } from './types';

export const getSendTarget = (
  config: MockServerComponent['configs'][number]
): SendTarget | undefined => {
  if ('method' in config) return { type: 'rest', method: config.method, path: String(config.path) };

  if ('operationType' in config && config.operationType !== 'subscription')
    return {
      type: 'graphql',
      identifier: String(config.identifier),
      operationType: config.operationType
    };

  return undefined;
};

const WHOLE_VALUE_ENTITIES = ['body', 'variables'];

const toMatcher = (entity: string, value: unknown, key?: string): RouteMatcher => {
  if (isSerializedComparator(value)) {
    const sources = getComparatorFunctionSources(value);

    return {
      entity,
      key,
      operator: value.$comparator,
      value: formatComparatorArguments(value),
      preview: [formatComparator(value), ...sources].join('\n\n')
    };
  }

  if (isSerializedFunction(value))
    return { entity, key, operator: 'matches', value: 'comparator', preview: value };

  return { entity, key, operator: 'equals', value: JSON.stringify(value) };
};

export const getRouteMatchers = (route: RouteEntry): RouteMatcher[] => {
  if (!route.entities) return [];

  return Object.entries(route.entities).flatMap(([entityName, entityValue]): RouteMatcher[] => {
    if (
      typeof entityValue !== 'object' ||
      entityValue === null ||
      isSerializedComparator(entityValue)
    )
      return [toMatcher(entityName, entityValue)];

    if (WHOLE_VALUE_ENTITIES.includes(entityName))
      return [
        { ...toMatcher(entityName, entityValue), preview: JSON.stringify(entityValue, null, 2) }
      ];

    return Object.entries(entityValue).map(([key, value]) => toMatcher(entityName, value, key));
  });
};

export const formatRouteData = (data: unknown) => {
  if (isSerializedFunction(data)) return data;
  return JSON.stringify(data, null, 2) ?? 'undefined';
};
