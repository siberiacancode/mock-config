import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { interceptorsSchema } from '../../interceptorsSchema/interceptorsSchema';
import { isOnlyRequestedDataResolvingPropertyExists } from '../../isOnlyRequestedDataResolvingPropertyExists';
import { queueSchema } from '../../queueSchema/queueSchema';
import { settingsSchema } from '../../settingsSchema/settingsSchema';
import { mappedEntitySchema, plainObjectSchema, variablesPlainEntitySchema } from '../../utils';

const baseRouteConfigSchema = z.strictObject({
  entities: plainObjectSchema(
    z.strictObject({
      headers: mappedEntitySchema.optional(),
      cookies: mappedEntitySchema.optional(),
      query: mappedEntitySchema.optional(),
      variables: variablesPlainEntitySchema.optional()
    })
  ).optional(),
  interceptors: plainObjectSchema(interceptorsSchema).optional()
});

const dataRouteConfigSchema = z
  .strictObject({
    settings: plainObjectSchema(
      settingsSchema.extend({ polling: z.literal(false).optional() })
    ).optional(),
    data: z.union([z.function(), z.any()])
  })
  .merge(baseRouteConfigSchema);

const queueRouteConfigSchema = z
  .strictObject({
    settings: settingsSchema.extend({ polling: z.literal(true) }),
    queue: queueSchema
  })
  .merge(baseRouteConfigSchema);

export const routeConfigSchema = z.union([
  z
    .custom(
      (value) => isPlainObject(value) && isOnlyRequestedDataResolvingPropertyExists(value, 'data')
    )
    .pipe(dataRouteConfigSchema),
  z
    .custom(
      (value) => isPlainObject(value) && isOnlyRequestedDataResolvingPropertyExists(value, 'queue')
    )
    .pipe(queueRouteConfigSchema)
]);
