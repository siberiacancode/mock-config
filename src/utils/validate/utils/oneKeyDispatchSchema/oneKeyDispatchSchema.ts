import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { getMostSpecificPathFromError } from '../../getValidationMessage';

// ✅ important:
// Runs only the schema that matches the single existing key
export const oneKeyDispatchSchema = (schemasByKey: Record<string, z.ZodTypeAny>) => {
  const keys = Object.keys(schemasByKey);

  return z
    .custom((value) => isPlainObject(value))
    .superRefine((value, ctx) => {
      const existingKeys = keys.filter((key) => Object.prototype.hasOwnProperty.call(value, key));

      if (existingKeys.length !== 1) {
        ctx.addIssue({
          code: 'custom',
          path: []
        });
        return;
      }

      const [key] = existingKeys;
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
};
