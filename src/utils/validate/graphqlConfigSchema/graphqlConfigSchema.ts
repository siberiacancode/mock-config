import { z } from 'zod';

import { baseUrlSchema } from '../baseUrlSchema/baseUrlSchema';
import { interceptorsSchema } from '../interceptorsSchema/interceptorsSchema';
import { oneKeyDispatchSchema } from '../utils';
import { routeConfigSchema } from './routeConfigSchema/routeConfigSchema';

const baseRequestConfigSchema = z.strictObject({
  operationType: z.enum(['query', 'mutation']),
  routes: z.array(routeConfigSchema),
  interceptors: interceptorsSchema.optional()
});

const operationNameRequestConfigSchema = z.strictObject({
  ...baseRequestConfigSchema.shape,
  operationName: z.union([z.string(), z.instanceof(RegExp)]),
  query: z.string().optional()
});

const queryRequestConfigSchema = z.strictObject({
  ...baseRequestConfigSchema.shape,
  operationName: z.union([z.string(), z.instanceof(RegExp)]).optional(),
  query: z.string()
});

// TODO at least operationName or query should exist
export const graphqlRequestConfigSchema = oneKeyDispatchSchema({
  operationName: operationNameRequestConfigSchema,
  query: queryRequestConfigSchema
});

export const graphqlConfigSchema = z.strictObject({
  baseUrl: baseUrlSchema.optional(),
  configs: z.array(graphqlRequestConfigSchema),
  interceptors: interceptorsSchema.optional()
});
