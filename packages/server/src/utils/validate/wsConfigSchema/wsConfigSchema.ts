import { z } from 'zod';

import { routeConfigSchema } from './routeConfigSchema/routeConfigSchema';

export const wsRequestConfigSchema = z.strictObject({
  event: z.union([z.string(), z.instanceof(RegExp)]),
  routes: z.array(routeConfigSchema)
});
