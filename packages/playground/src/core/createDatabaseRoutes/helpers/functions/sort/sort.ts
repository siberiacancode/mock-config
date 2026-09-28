import type { ParsedUrlQuery } from 'node:querystring';

import { flatten } from 'flat';

import type { PlainObject } from '@/shared/types';

type Order = 'asc' | 'desc';
const DEFAULT_ORDER = 'asc';

const getOrder = (order?: string) => {
  if (order === 'asc' || order === 'desc') return order;
  return DEFAULT_ORDER;
};

const sortArray = (array: PlainObject[], key: string, order: Order) =>
  array.sort((a, b) => {
    const flattenedA = flatten<PlainObject, PlainObject>(a);
    const flattenedB = flatten<PlainObject, PlainObject>(b);
    const valueA = flattenedA[key];
    const valueB = flattenedB[key];

    if (valueA === undefined || valueB === undefined) return 0;

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }

    return order === 'asc' ? Number(valueA) - Number(valueB) : Number(valueB) - Number(valueA);
  });

export const sort = (array: PlainObject[], queries: ParsedUrlQuery) => {
  const { _sort, _order = DEFAULT_ORDER } = queries;
  if (!_sort) return array;

  const result = [...array];

  if (Array.isArray(_sort)) {
    const orders = Array.isArray(_order) ? _order : [_order];

    _sort.forEach((key, index) => {
      const order = getOrder(orders[index]);
      sortArray(result, key, order);
    });

    return result;
  }

  const order = getOrder(Array.isArray(_order) ? _order[0] : _order);
  sortArray(result, _sort, order);

  return result;
};
