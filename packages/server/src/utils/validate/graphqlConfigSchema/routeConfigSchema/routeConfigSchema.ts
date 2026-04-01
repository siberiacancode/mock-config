import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { interceptorsSchema } from '../../interceptorsSchema/interceptorsSchema';
import { settingsSchema } from '../../settingsSchema/settingsSchema';
import { mappedEntitySchema, plainObjectSchema, variablesPlainEntitySchema } from '../../utils';

const dataRouteConfigSchema = z.strictObject({
  settings: plainObjectSchema(settingsSchema).optional(),
  data: z.union([z.function(), z.any()]),
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

export const routeConfigSchema = z
  .custom((value) => isPlainObject(value) && 'data' in value)
  .pipe(dataRouteConfigSchema);
