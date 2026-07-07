import { z } from 'zod';

import {
  connectionRouteConfigSchema,
  rawRouteConfigSchema
} from './routeConfigSchema/routeConfigSchema';

export const socketIoRequestConfigSchema = z.union([
  z.strictObject({
    type: z.literal('message'),
    transportType: z.literal('socket.io'),
    routes: z.array(rawRouteConfigSchema)
  }),
  z.strictObject({
    type: z.literal('connection'),
    transportType: z.literal('socket.io'),
    routes: z.array(connectionRouteConfigSchema)
  })
]);
