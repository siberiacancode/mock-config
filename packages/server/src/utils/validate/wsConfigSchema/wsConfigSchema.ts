import { z } from 'zod';

import {
  closeRouteConfigSchema,
  connectionRouteConfigSchema,
  errorRouteConfigSchema,
  messageRouteConfigSchema
} from './routeConfigSchema/routeConfigSchema';

export const wsRequestConfigSchema = z.union([
  z.strictObject({
    type: z.literal('message'),
    routes: z.array(messageRouteConfigSchema)
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
