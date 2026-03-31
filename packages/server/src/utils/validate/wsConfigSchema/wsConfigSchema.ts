import { z } from 'zod';

import { WS_MESSAGE_EVENT } from '@/utils/types';

import { routeConfigSchema } from './routeConfigSchema/routeConfigSchema';

const wsEventRequestConfigSchema = z.strictObject({
  event: z.union([z.string(), z.instanceof(RegExp)]),
  routes: z.array(routeConfigSchema)
});

const wsMessageRequestConfigSchema = z.strictObject({
  event: z.symbol(WS_MESSAGE_EVENT),
  routes: z.array(
    z.strictObject({
      data: z.function()
    })
  )
});

export const wsRequestConfigSchema = z.union([
  wsEventRequestConfigSchema,
  wsMessageRequestConfigSchema
]);
