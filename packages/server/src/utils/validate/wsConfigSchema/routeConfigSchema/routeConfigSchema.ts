import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { mappedEntitySchema, plainObjectSchema } from '../../utils';

export const rawRouteConfigSchema = z.strictObject({
  data: z.function()
});

export const connectionRouteConfigSchema = z.strictObject({
  data: z.function(),
  entities: plainObjectSchema(
    z.strictObject({
      headers: mappedEntitySchema.optional(),
      cookies: mappedEntitySchema.optional(),
      queries: mappedEntitySchema.optional()
    })
  ).optional()
});

export const closeRouteConfigSchema = z.strictObject({
  data: z.function()
});

export const errorRouteConfigSchema = z.strictObject({
  data: z.function()
});

export const routeConfigSchema = z
  .custom((value) => isPlainObject(value) && 'data' in value)
  .pipe(rawRouteConfigSchema);
