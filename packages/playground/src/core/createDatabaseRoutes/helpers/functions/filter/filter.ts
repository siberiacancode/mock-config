import type { ParsedUrlQuery } from 'node:querystring';

import { flatten } from 'flat';

const OPERATORS = {
  eq: (a: unknown, b: unknown) => `${a}` === `${b}`,
  neq: (a: unknown, b: unknown) => `${a}` !== `${b}`,
  gt: (a: unknown, b: unknown) => Number(a) > Number(b),
  gte: (a: unknown, b: unknown) => Number(a) >= Number(b),
  lt: (a: unknown, b: unknown) => Number(a) < Number(b),
  lte: (a: unknown, b: unknown) => Number(a) <= Number(b),
  cn: (a: unknown, b: unknown) => String(a).includes(String(b)),
  ncn: (a: unknown, b: unknown) => !String(a).includes(String(b)),
  sw: (a: unknown, b: unknown) => String(a).startsWith(String(b)),
  nsw: (a: unknown, b: unknown) => !String(a).startsWith(String(b)),
  ew: (a: unknown, b: unknown) => String(a).endsWith(String(b)),
  new: (a: unknown, b: unknown) => !String(a).endsWith(String(b)),
  some: (a: unknown, b: unknown) =>
    Array.isArray(a) && a.some((element: unknown) => `${element}` === `${b}`)
} as const;

const OPERATORS_KEYS = Object.keys(OPERATORS);
const OPERATOR_REGEXP = new RegExp(`^(.+)_(${OPERATORS_KEYS.join('|')})$`);

const getEntities = (object: any, key: string) => {
  const parts = key.match(OPERATOR_REGEXP);

  if (!parts) {
    return {
      operator: 'eq',
      element: object[key]
    } as const;
  }

  const [, element, operator] = parts;

  if (operator === 'some') {
    const array = Object.entries(object).filter(([objectKey]) =>
      new RegExp(`^${element}.\\d$`).test(objectKey)
    );
    return {
      operator,
      element: array.map(([, value]) => value)
    } as const;
  }

  return {
    element: object[element],
    operator: operator as keyof typeof OPERATORS
  };
};

export const filter = (array: any[], filters: ParsedUrlQuery) =>
  array.filter((arrayElement) => {
    const flattenedArrayElement = flatten<any, any>(arrayElement);

    return Object.entries(filters).every(([key, filter]) => {
      if (Array.isArray(filter)) {
        const { element, operator } = getEntities(flattenedArrayElement, key);
        return filter.some((value) => OPERATORS[operator](element, value));
      }

      const { element, operator } = getEntities(flattenedArrayElement, key);
      return OPERATORS[operator](element, filter);
    });
  });
