import type { ParsedUrlQuery } from 'node:querystring';

import { flatten } from 'flat';

type Order = 'asc' | 'desc';
const DEFAULT_ORDER = 'asc';

const getOrder = (order?: string) => {
  if (order === 'asc' || order === 'desc') return order;
  return DEFAULT_ORDER;
};

const sortArray = (array: any[], key: string, order: Order) =>
  array.sort((a, b) => {
    const flattenedA = flatten<any, any>(a);
    const flattenedB = flatten<any, any>(b);

    if (!flattenedA[key] || !flattenedB[key]) return 0;

    if (typeof flattenedA[key] === 'string' && typeof flattenedB[key] === 'string') {
      return order === 'asc'
        ? flattenedA[key].localeCompare(flattenedB[key])
        : flattenedB[key].localeCompare(flattenedA[key]);
    }

    return order === 'asc'
      ? Number(flattenedA[key]) - Number(flattenedB[key])
      : Number(flattenedB[key]) - Number(flattenedA[key]);
  });

export const sort = (array: any[], queries: ParsedUrlQuery) => {
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
