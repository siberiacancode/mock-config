import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { getMostSpecificPathFromError } from '../getValidationMessage';

type ZodAny = z.ZodTypeAny;

// Runs only the schema that matches the single existing key.
export function oneKeyDispatchSchema<K extends string, S extends Record<K, ZodAny>>(
  schemasByKey: S
) {
  const keys = Object.keys(schemasByKey) as K[];

  return z
    .custom((value) => isPlainObject(value))
    .superRefine((value, ctx) => {
      const existing = keys.filter((k) => Object.prototype.hasOwnProperty.call(value, k));

      if (existing.length !== 1) {
        ctx.addIssue({
          code: 'custom',
          path: [],
          message: `Expected exactly one of: ${keys.join(', ')}`
        });
        return;
      }

      const key = existing[0];
      const schema = schemasByKey[key];

      const result = schema.safeParse(value);
      if (!result.success) {
        const issuePath = getMostSpecificPathFromError(result.error.issues);
        ctx.addIssue({
          code: 'custom',
          path: issuePath
        });
      }
    });
}
