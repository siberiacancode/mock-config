import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { plainObjectSchema } from '../utils';
import { subscriptionRouteConfigSchema } from './subscriptionRouteConfigSchema/subscriptionRouteConfigSchema';

const graphqlSubscriptionInterceptorsSchema = z.strictObject({
  request: z.function().optional(),
  response: z.function().optional()
});

const baseSubscriptionRequestConfigSchema = z.strictObject({
  operationType: z.literal('subscription'),
  routes: z.array(subscriptionRouteConfigSchema),
  interceptors: plainObjectSchema(graphqlSubscriptionInterceptorsSchema).optional()
});

const operationNameSubscriptionRequestConfigSchema = z
  .strictObject({
    operationName: z.union([z.string(), z.instanceof(RegExp)]),
    eventName: z.union([z.string(), z.instanceof(RegExp)]).optional(),
    query: z.string().optional()
  })
  .merge(baseSubscriptionRequestConfigSchema);

const querySubscriptionRequestConfigSchema = z
  .strictObject({
    eventName: z.union([z.string(), z.instanceof(RegExp)]).optional(),
    operationName: z.union([z.string(), z.instanceof(RegExp)]).optional(),
    query: z.string()
  })
  .merge(baseSubscriptionRequestConfigSchema);

const eventNameSubscriptionRequestConfigSchema = z
  .strictObject({
    eventName: z.union([z.string(), z.instanceof(RegExp)]),
    operationName: z.union([z.string(), z.instanceof(RegExp)]).optional(),
    query: z.string().optional()
  })
  .merge(baseSubscriptionRequestConfigSchema);

export const graphqlSubscriptionRequestConfigSchema = z.union([
  z
    .custom((value) => isPlainObject(value) && 'operationName' in value)
    .pipe(operationNameSubscriptionRequestConfigSchema),
  z
    .custom((value) => isPlainObject(value) && 'query' in value)
    .pipe(querySubscriptionRequestConfigSchema),
  z
    .custom((value) => isPlainObject(value) && 'eventName' in value)
    .pipe(eventNameSubscriptionRequestConfigSchema)
]);
