import type { ParsedUrlQuery } from 'node:querystring';

import { flatten } from 'flat';

const OPERATORS = {
  eq: (a: any, b: any) => `${a}` === `${b}`,
  neq: (a: any, b: any) => `${a}` !== `${b}`,
  gt: (a: any, b: any) => +a > +b,
  gte: (a: any, b: any) => +a >= +b,
  lt: (a: any, b: any) => +a < +b,
  lte: (a: any, b: any) => +a <= +b,
  cn: (a: any, b: any) => a.includes(b),
  ncn: (a: any, b: any) => !a.includes(b),
  sw: (a: any, b: any) => a.startsWith(b),
  nsw: (a: any, b: any) => !a.startsWith(b),
  ew: (a: any, b: any) => a.endsWith(b),
  new: (a: any, b: any) => !a.endsWith(b),
  some: (a: any[], b: any) => a.some((element: any) => `${element}` === `${b}`)
} as const;

const OPERATORS_KEYS = Object.keys(OPERATORS);
const OPERATOR_REGEXP = new RegExp(`^(.+)_(${OPERATORS_KEYS.join('|')})$`);

const getEntities = (object: Record<string, any>, key: string) => {
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
    const flattenedArrayElement = flatten<string, any>(arrayElement);

    return Object.entries(filters).every(([key, filter]) => {
      if (Array.isArray(filter)) {
        const { element, operator } = getEntities(flattenedArrayElement, key);
        return filter.some((value) => OPERATORS[operator](element, value));
      }

      const { element, operator } = getEntities(flattenedArrayElement, key);
      return OPERATORS[operator](element, filter);
    });
  });
