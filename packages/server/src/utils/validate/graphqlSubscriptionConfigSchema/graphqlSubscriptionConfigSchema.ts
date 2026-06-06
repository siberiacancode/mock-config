import { z } from 'zod';

import { interceptorsSchema } from '../interceptorsSchema/interceptorsSchema';
import { plainObjectSchema } from '../utils';
import { subscriptionRouteConfigSchema } from './subscriptionRouteConfigSchema/subscriptionRouteConfigSchema';

export const graphqlSubscriptionRequestConfigSchema = z.strictObject({
  identifier: z.union([z.string(), z.instanceof(RegExp)]),
  operationType: z.literal('subscription'),
  routes: z.array(subscriptionRouteConfigSchema),
  interceptors: plainObjectSchema(interceptorsSchema).optional()
});
