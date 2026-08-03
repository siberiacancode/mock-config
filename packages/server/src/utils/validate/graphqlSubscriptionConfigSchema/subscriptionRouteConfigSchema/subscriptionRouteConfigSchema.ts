import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { plainObjectSchema, variablesEntitySchema } from '../../utils';

const subscriptionSettingsSchema = z.strictObject({
  delay: z.number().nonnegative().optional()
});

export const subscriptionRouteConfigSchema = z
  .custom((value) => isPlainObject(value) && 'data' in value)
  .pipe(
    z.strictObject({
      settings: plainObjectSchema(subscriptionSettingsSchema).optional(),
      data: z.union([z.function(), z.any()]),
      entities: plainObjectSchema(
        z.strictObject({
          variables: variablesEntitySchema.optional()
        })
      ).optional()
    })
  );
