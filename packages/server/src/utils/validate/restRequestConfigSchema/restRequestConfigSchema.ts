import { z } from 'zod';

import type { RestMethod } from '@/utils/types';

import { interceptorsSchema } from '../interceptorsSchema/interceptorsSchema';
import { plainObjectSchema, stringForwardSlashSchema } from '../utils';
import { routeConfigSchema } from './routeConfigSchema/routeConfigSchema';

const baseRequestConfigSchema = (method: RestMethod) =>
  z.strictObject({
    path: z.union([stringForwardSlashSchema, z.instanceof(RegExp)]),
    transportType: z.literal('rest'),
    method: z.literal(method),
    routes: z.array(routeConfigSchema(method)),
    interceptors: plainObjectSchema(interceptorsSchema).optional()
  });

export const restRequestConfigSchema = z.union([
  baseRequestConfigSchema('get'),
  baseRequestConfigSchema('post'),
  baseRequestConfigSchema('put'),
  baseRequestConfigSchema('delete'),
  baseRequestConfigSchema('patch'),
  baseRequestConfigSchema('options')
]);
