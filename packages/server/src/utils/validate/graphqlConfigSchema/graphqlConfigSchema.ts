import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { baseUrlSchema } from '../baseUrlSchema/baseUrlSchema';
import { interceptorsSchema } from '../interceptorsSchema/interceptorsSchema';
import { plainObjectSchema } from '../utils';
import { routeConfigSchema } from './routeConfigSchema/routeConfigSchema';

const baseRequestConfigSchema = z.strictObject({
  operationType: z.enum(['query', 'mutation']),
  routes: z.array(routeConfigSchema),
  interceptors: plainObjectSchema(interceptorsSchema).optional()
});

const operationNameRequestConfigSchema = z
  .strictObject({
    operationName: z.union([z.string(), z.instanceof(RegExp)]),
    query: z.string().optional()
  })
  .merge(baseRequestConfigSchema);

const queryRequestConfigSchema = z
  .strictObject({
    operationName: z.union([z.string(), z.instanceof(RegExp)]).optional(),
    query: z.string()
  })
  .merge(baseRequestConfigSchema);

export const graphqlRequestConfigSchema = z.union([
  z
    .custom((value) => isPlainObject(value) && 'operationName' in value)
    .pipe(operationNameRequestConfigSchema),
  z.custom((value) => isPlainObject(value) && 'query' in value).pipe(queryRequestConfigSchema)
]);

export const graphqlConfigSchema = z.strictObject({
  baseUrl: baseUrlSchema.optional(),
  configs: z.array(graphqlRequestConfigSchema),
  interceptors: plainObjectSchema(interceptorsSchema).optional()
});
