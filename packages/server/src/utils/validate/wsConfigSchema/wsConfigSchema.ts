import { z } from 'zod';

import { routeConfigSchema } from './routeConfigSchema/routeConfigSchema';

export const wsRequestConfigSchema = z.strictObject({
  protocol: z.literal('raw'),
  routes: z.array(routeConfigSchema)
});
