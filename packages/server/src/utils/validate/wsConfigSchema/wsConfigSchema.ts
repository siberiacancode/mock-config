import { z } from 'zod';

import {
  connectionRouteConfigSchema,
  rawRouteConfigSchema
} from './routeConfigSchema/routeConfigSchema';

export const wsRequestConfigSchema = z.union([
  z.strictObject({
    type: z.literal('raw'),
    routes: z.array(rawRouteConfigSchema)
  }),
  z.strictObject({
    type: z.literal('connection'),
    routes: z.array(connectionRouteConfigSchema)
  })
]);
