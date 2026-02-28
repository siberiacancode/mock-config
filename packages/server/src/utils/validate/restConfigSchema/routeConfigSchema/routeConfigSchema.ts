import { z } from 'zod';

import type { RestMethod } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

import { interceptorsSchema } from '../../interceptorsSchema/interceptorsSchema';
import { isOnlyRequestedDataResolvingPropertyExists } from '../../isOnlyRequestedDataResolvingPropertyExists';
import { queueSchema } from '../../queueSchema/queueSchema';
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
      settings: plainObjectSchema(
        settingsSchema.extend({ polling: z.literal(false).optional() })
      ).optional(),
      data: z.union([z.function(), z.any()])
    })
    .merge(baseRouteConfigSchema(method));

const fileRouteConfigSchema = (method: RestMethod) =>
  z
    .strictObject({
      settings: plainObjectSchema(
        settingsSchema.extend({ polling: z.literal(false).optional() })
      ).optional(),
      file: z.string()
    })
    .merge(baseRouteConfigSchema(method));

const queueRouteConfigSchema = (method: RestMethod) =>
  z
    .strictObject({
      settings: settingsSchema.extend({ polling: z.literal(true) }),
      queue: queueSchema
    })
    .merge(baseRouteConfigSchema(method));

export const routeConfigSchema = (method: RestMethod) =>
  z.union([
    z
      .custom(
        (value) => isPlainObject(value) && isOnlyRequestedDataResolvingPropertyExists(value, 'data')
      )
      .pipe(dataRouteConfigSchema(method)),
    z
      .custom(
        (value) => isPlainObject(value) && isOnlyRequestedDataResolvingPropertyExists(value, 'file')
      )
      .pipe(fileRouteConfigSchema(method)),
    z
      .custom(
        (value) =>
          isPlainObject(value) && isOnlyRequestedDataResolvingPropertyExists(value, 'queue')
      )
      .pipe(queueRouteConfigSchema(method))
  ]);
