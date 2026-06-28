import { z } from 'zod';

import {
  closeRouteConfigSchema,
  connectionRouteConfigSchema,
  errorRouteConfigSchema,
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
  }),
  z.strictObject({
    type: z.literal('close'),
    routes: z.array(closeRouteConfigSchema)
  }),
  z.strictObject({
    type: z.literal('error'),
    routes: z.array(errorRouteConfigSchema)
  })
]);
