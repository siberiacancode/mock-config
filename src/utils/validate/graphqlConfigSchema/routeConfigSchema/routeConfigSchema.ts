import { z } from 'zod';

import { interceptorsSchema } from '../../interceptorsSchema/interceptorsSchema';
import { queueSchema } from '../../queueSchema/queueSchema';
import { settingsSchema } from '../../settingsSchema/settingsSchema';
import { mappedEntitySchema, variablesPlainEntitySchema } from '../../utils';
import { oneKeyDispatchSchema } from '../../utils/testSchema';

const baseRouteConfigSchema = z.strictObject({
  entities: z
    .strictObject({
      headers: mappedEntitySchema.optional(),
      cookies: mappedEntitySchema.optional(),
      query: mappedEntitySchema.optional(),
      variables: variablesPlainEntitySchema.optional()
    })
    .optional(),
  interceptors: interceptorsSchema.optional()
});

// data will be presented because of routeConfigSchema oneKeyDispatchSchema
const dataRouteConfigSchema = z.strictObject({
  ...baseRouteConfigSchema.shape,
  settings: settingsSchema.extend({ polling: z.literal(false).optional() }).optional(),
  data: z.union([z.function(), z.any()])
});

// queue will be presented because of routeConfigSchema oneKeyDispatchSchema
const queueRouteConfigSchema = z.strictObject({
  ...baseRouteConfigSchema.shape,
  settings: settingsSchema.extend({ polling: z.literal(true) }),
  queue: queueSchema
});

export const routeConfigSchema = oneKeyDispatchSchema({
  data: dataRouteConfigSchema,
  queue: queueRouteConfigSchema
});
