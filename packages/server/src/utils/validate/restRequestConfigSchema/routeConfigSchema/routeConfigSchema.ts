import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { interceptorsSchema } from '../../interceptorsSchema/interceptorsSchema';
import { settingsSchema } from '../../settingsSchema/settingsSchema';
import { bodyEntitySchema, mappedEntitySchema, plainObjectSchema } from '../../utils';

const entitiesByEntityNameSchema = () =>
  plainObjectSchema(
    z.strictObject({
      headers: mappedEntitySchema.optional(),
      cookies: mappedEntitySchema.optional(),
      params: mappedEntitySchema.optional(),
      queries: mappedEntitySchema.optional(),
      body: bodyEntitySchema.optional()
    })
  );

const dataRouteConfigSchema = () =>
  z.strictObject({
    settings: plainObjectSchema(settingsSchema).optional(),
    data: z.union([z.function(), z.any()]),
    entities: entitiesByEntityNameSchema().optional(),
    interceptors: plainObjectSchema(interceptorsSchema).optional()
  });

export const routeConfigSchema = () =>
  z.custom((value) => isPlainObject(value) && 'data' in value).pipe(dataRouteConfigSchema());
