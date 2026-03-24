import { z } from 'zod';

import { interceptorsSchema } from '../interceptorsSchema/interceptorsSchema';
import { settingsSchema } from '../settingsSchema/settingsSchema';
import { mappedEntitySchema, messagePlainEntitySchema, plainObjectSchema } from '../utils';

const websocketRouteConfigSchema = z
  .strictObject({
    event: z.union([z.function(), z.any()]).optional(),
    entities: plainObjectSchema(
      z.strictObject({
        headers: mappedEntitySchema.optional(),
        cookies: mappedEntitySchema.optional(),
        query: mappedEntitySchema.optional(),
        message: messagePlainEntitySchema.optional()
      })
    ).optional(),
    settings: plainObjectSchema(settingsSchema.omit({ polling: true, status: true })).optional(),
    interceptors: plainObjectSchema(interceptorsSchema).optional()
  })
  .refine(
    (route) => typeof route.event !== 'undefined' || !!route.interceptors || !!route.entities,
    'WebSocket route should contain at least one of: event, entities, interceptors'
  );

export const websocketRequestConfigSchema = z.strictObject({
  event: z.union([z.string(), z.instanceof(RegExp)]),
  routes: z.array(websocketRouteConfigSchema),
  interceptors: plainObjectSchema(interceptorsSchema).optional()
});

