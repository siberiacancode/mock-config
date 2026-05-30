import { z } from 'zod';

import { interceptorsSchema } from '../interceptorsSchema/interceptorsSchema';
import { plainObjectSchema } from '../utils';
import { routeConfigSchema } from './routeConfigSchema/routeConfigSchema';

const baseRequestConfigSchema = z.strictObject({
  operationType: z.enum(['query', 'mutation']),
  routes: z.array(routeConfigSchema),
  interceptors: plainObjectSchema(interceptorsSchema).optional()
});

export const graphqlRequestConfigSchema = z
  .strictObject({
    identifier: z.union([z.string(), z.instanceof(RegExp)])
  })
  .merge(baseRequestConfigSchema);
