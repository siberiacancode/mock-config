import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { bodyPlainEntitySchema, plainObjectSchema } from '../../utils';

const baseRouteConfigSchema = z.strictObject({
  entities: plainObjectSchema(
    z.strictObject({
      payload: bodyPlainEntitySchema.optional()
    })
  ).optional()
});

const dataRouteConfigSchema = z
  .strictObject({
    data: z.union([z.function(), z.any()])
  })
  .merge(baseRouteConfigSchema);

export const routeConfigSchema = z
  .custom((value) => isPlainObject(value) && 'data' in value)
  .pipe(dataRouteConfigSchema);
