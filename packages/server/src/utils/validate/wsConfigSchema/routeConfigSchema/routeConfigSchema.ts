import { z } from 'zod';

import type { Comparator } from '@/utils/types';

import { isComparator, isPlainObject } from '@/utils/helpers';

import { mappedEntitySchema, plainObjectSchema } from '../../utils';

export const messageRouteConfigSchema = z.strictObject({
  data: z.function(),
  entities: plainObjectSchema(
    z.strictObject({
      data: z.any().optional(),
      isBinary: z.union([z.boolean(), z.custom<Comparator>(isComparator)]).optional()
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
      code: z.union([z.number(), z.custom<Comparator>(isComparator)]).optional(),
      reason: z.union([z.string(), z.custom<Comparator>(isComparator)]).optional()
    })
  ).optional()
});

export const errorRouteConfigSchema = z.strictObject({
  data: z.function(),
  entities: plainObjectSchema(
    z.strictObject({
      code: z.union([z.string(), z.custom<Comparator>(isComparator)]).optional(),
      message: z.union([z.string(), z.custom<Comparator>(isComparator)]).optional()
    })
  ).optional()
});

export const routeConfigSchema = z
  .custom((value) => isPlainObject(value) && 'data' in value)
  .pipe(messageRouteConfigSchema);
