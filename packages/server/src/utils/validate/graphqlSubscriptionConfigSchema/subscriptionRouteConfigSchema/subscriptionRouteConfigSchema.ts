import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { plainObjectSchema, variablesPlainEntitySchema } from '../../utils';

export const subscriptionRouteConfigSchema = z
  .custom((value) => isPlainObject(value) && 'data' in value)
  .pipe(
    z.strictObject({
      data: z.union([z.function(), z.any()]),
      entities: plainObjectSchema(
        z.strictObject({
          variables: variablesPlainEntitySchema.optional()
        })
      ).optional()
    })
  );
