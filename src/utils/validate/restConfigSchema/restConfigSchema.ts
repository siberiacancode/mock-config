import { z } from 'zod';

import type { RestMethod } from '@/utils/types';

import { baseUrlSchema } from '../baseUrlSchema/baseUrlSchema';
import { interceptorsSchema } from '../interceptorsSchema/interceptorsSchema';
import { stringForwardSlashSchema } from '../utils';
import { routeConfigSchema } from './routeConfigSchema/routeConfigSchema';

const baseRequestConfigSchema = (method: RestMethod) =>
  z.strictObject({
    path: z.union([stringForwardSlashSchema, z.instanceof(RegExp)]),
    method: z.literal(method),
    routes: z.array(routeConfigSchema(method)),
    interceptors: interceptorsSchema.optional()
  });

export const restRequestConfigSchema = z.union([
  baseRequestConfigSchema('get'),
  baseRequestConfigSchema('post'),
  baseRequestConfigSchema('put'),
  baseRequestConfigSchema('delete'),
  baseRequestConfigSchema('patch'),
  baseRequestConfigSchema('options')
]);

export const restConfigSchema = z.strictObject({
  baseUrl: baseUrlSchema.optional(),
  configs: z.array(restRequestConfigSchema),
  interceptors: interceptorsSchema.optional()
});
