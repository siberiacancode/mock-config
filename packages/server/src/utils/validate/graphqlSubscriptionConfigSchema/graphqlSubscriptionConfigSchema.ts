import { z } from 'zod';

import { interceptorsSchema } from '../interceptorsSchema/interceptorsSchema';
import { plainObjectSchema } from '../utils';
import { subscriptionRouteConfigSchema } from './subscriptionRouteConfigSchema/subscriptionRouteConfigSchema';

const baseSubscriptionRequestConfigSchema = z.strictObject({
  operationType: z.literal('subscription'),
  routes: z.array(subscriptionRouteConfigSchema),
  interceptors: plainObjectSchema(interceptorsSchema).optional()
});

export const graphqlSubscriptionRequestConfigSchema = z
  .strictObject({
    identifier: z.union([z.string(), z.instanceof(RegExp)])
  })
  .merge(baseSubscriptionRequestConfigSchema);
