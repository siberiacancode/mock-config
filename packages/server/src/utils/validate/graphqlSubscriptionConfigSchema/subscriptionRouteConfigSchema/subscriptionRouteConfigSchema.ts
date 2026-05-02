import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { plainObjectSchema, variablesEntitySchema } from '../../utils';

const subscriptionDataRouteConfigSchema = z.strictObject({
  data: z.union([z.function(), z.any()]),
  entities: plainObjectSchema(
    z.strictObject({
      variables: variablesEntitySchema.optional()
    })
  ).optional()
});

export const subscriptionRouteConfigSchema = z
  .custom((value) => isPlainObject(value) && 'data' in value)
  .pipe(subscriptionDataRouteConfigSchema);
