import { z } from 'zod';

import type { RestMethod } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

import { interceptorsSchema } from '../../interceptorsSchema/interceptorsSchema';
import { settingsSchema } from '../../settingsSchema/settingsSchema';
import { bodyPlainEntitySchema, mappedEntitySchema, plainObjectSchema } from '../../utils';

const METHODS_WITH_BODY = ['post', 'put', 'patch'];
const entitiesByEntityNameSchema = (method: RestMethod) => {
  const isMethodWithBody = METHODS_WITH_BODY.includes(method);
  return plainObjectSchema(
    z.strictObject({
      headers: mappedEntitySchema.optional(),
      cookies: mappedEntitySchema.optional(),
      params: mappedEntitySchema.optional(),
      query: mappedEntitySchema.optional(),
      ...(isMethodWithBody && { body: bodyPlainEntitySchema.optional() })
    })
  );
};

const baseRouteConfigSchema = (method: RestMethod) =>
  z.strictObject({
    entities: entitiesByEntityNameSchema(method).optional(),
    interceptors: plainObjectSchema(interceptorsSchema).optional()
  });

const dataRouteConfigSchema = (method: RestMethod) =>
  z
    .strictObject({
      settings: plainObjectSchema(settingsSchema).optional(),
      data: z.union([z.function(), z.any()])
    })
    .merge(baseRouteConfigSchema(method));

export const routeConfigSchema = (method: RestMethod) =>
  z.custom((value) => isPlainObject(value) && 'data' in value).pipe(dataRouteConfigSchema(method));
