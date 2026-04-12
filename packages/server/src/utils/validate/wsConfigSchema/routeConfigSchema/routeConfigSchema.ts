import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

const dataRouteConfigSchema = z.strictObject({
  data: z.function()
});

export const routeConfigSchema = z
  .custom((value) => isPlainObject(value) && 'data' in value)
  .pipe(dataRouteConfigSchema);
