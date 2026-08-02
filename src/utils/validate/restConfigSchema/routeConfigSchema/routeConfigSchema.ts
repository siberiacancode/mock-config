import { z } from 'zod';

import type { RestMethod } from '@/utils/types';

import { interceptorsSchema } from '../../interceptorsSchema/interceptorsSchema';
import { queueSchema } from '../../queueSchema/queueSchema';
import { settingsSchema } from '../../settingsSchema/settingsSchema';
import { bodyPlainEntitySchema, mappedEntitySchema, oneKeyDispatchSchema } from '../../utils';

const METHODS_WITH_BODY = ['post', 'put', 'patch'];
const entitiesByEntityNameSchema = (method: RestMethod) => {
  const isMethodWithBody = METHODS_WITH_BODY.includes(method);
  return z.strictObject({
    headers: mappedEntitySchema.optional(),
    cookies: mappedEntitySchema.optional(),
    params: mappedEntitySchema.optional(),
    query: mappedEntitySchema.optional(),
    ...(isMethodWithBody && { body: bodyPlainEntitySchema.optional() })
  });
};

const baseRouteConfigSchema = (method: RestMethod) =>
  z.strictObject({
    entities: entitiesByEntityNameSchema(method).optional(),
    interceptors: interceptorsSchema.optional()
  });

const dataRouteConfigSchema = (method: RestMethod) =>
  z.strictObject({
    ...baseRouteConfigSchema(method).shape,
    settings: settingsSchema.extend({ polling: z.literal(false).optional() }).optional(),
    data: z.union([z.function(), z.any()])
  });

const fileRouteConfigSchema = (method: RestMethod) =>
  z.strictObject({
    ...baseRouteConfigSchema(method).shape,
    settings: settingsSchema.extend({ polling: z.literal(false).optional() }).optional(),
    file: z.string()
  });

const queueRouteConfigSchema = (method: RestMethod) =>
  z.strictObject({
    ...baseRouteConfigSchema(method).shape,
    settings: settingsSchema.extend({ polling: z.literal(true) }),
    queue: queueSchema
  });

export const routeConfigSchema = (method: RestMethod) =>
  oneKeyDispatchSchema({
    data: dataRouteConfigSchema(method),
    file: fileRouteConfigSchema(method),
    queue: queueRouteConfigSchema(method)
  });
