import { z } from 'zod';

import type { Comparator } from '@/utils/types';

import { isComparator, isPlainObject } from '@/utils/helpers';

import { mappedEntitySchema, plainObjectSchema } from '../../utils';

const comparatorSchema = z.custom<Comparator>(isComparator);

export const rawRouteConfigSchema = z.strictObject({
  data: z.function(),
  entities: plainObjectSchema(
    z.strictObject({
      data: z.any().optional(),
      isBinary: z.union([z.boolean(), comparatorSchema]).optional()
    })
  ).optional()
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
  data: z.function(),
  entities: plainObjectSchema(
    z.strictObject({
      code: z.union([z.number(), comparatorSchema]).optional(),
      reason: z.union([z.string(), comparatorSchema]).optional()
    })
  ).optional()
});

export const errorRouteConfigSchema = z.strictObject({
  data: z.function(),
  entities: plainObjectSchema(
    z.strictObject({
      message: z.union([z.string(), comparatorSchema]).optional()
    })
  ).optional()
});

export const routeConfigSchema = z
  .custom((value) => isPlainObject(value) && 'data' in value)
  .pipe(rawRouteConfigSchema);
