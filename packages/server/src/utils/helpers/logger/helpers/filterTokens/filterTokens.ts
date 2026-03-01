import type { PlainObject } from '@/utils/types';

import { isPlainObject } from '../../../isPlainObject/isPlainObject';

type TokenNestedOption = Record<string, boolean>;

type TokenNestedOptionFilterMode = 'blacklist' | 'whitelist';

const resolveNestedOptionFilterMode = (
  nestedOption: TokenNestedOption
): TokenNestedOptionFilterMode => {
  const values = Object.values(nestedOption);
  return values.some(Boolean) ? 'whitelist' : 'blacklist';
};

type TokenOptions = Record<string, boolean | TokenNestedOption>;

export const filterTokens = (tokens: PlainObject, options: TokenOptions): PlainObject =>
  Object.entries(options).reduce((acc, [name, option]) => {
    const token = tokens[name];

    if (option === true) {
      acc[name] = token;
      return acc;
    }

    const isNestedOption = isPlainObject(option);
    const isNestedToken = isPlainObject(token);
    if (isNestedOption && isNestedToken) {
      const nestedOptionFilterMode = resolveNestedOptionFilterMode(option);

      if (nestedOptionFilterMode === 'whitelist') {
        acc[name] = Object.entries(option).reduce((acc, [name, nestedOption]) => {
          if (nestedOption) {
            acc[name] = token[name];
          }
          return acc;
        }, {} as PlainObject);
      }
      if (nestedOptionFilterMode === 'blacklist') {
        acc[name] = Object.keys(token).reduce((acc, name) => {
          if (option[name] !== false) {
            acc[name] = token[name];
          }
          return acc;
        }, {} as PlainObject);
      }
    }

    return acc;
  }, {} as PlainObject);
