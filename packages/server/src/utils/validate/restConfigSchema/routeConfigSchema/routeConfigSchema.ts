import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import { interceptorsSchema } from '../../interceptorsSchema/interceptorsSchema';
import { isOnlyRequestedDataResolvingPropertyExists } from '../../isOnlyRequestedDataResolvingPropertyExists';
import { queueSchema } from '../../queueSchema/queueSchema';
import { settingsSchema } from '../../settingsSchema/settingsSchema';
import { plainObjectSchema } from '../../utils';

// const METHODS_WITH_BODY = ['post', 'put', 'patch'];
// const entitiesByEntityNameSchema = (method: RestMethod) => {
//   const isMethodWithBody = METHODS_WITH_BODY.includes(method);
//   return plainObjectSchema(
//     z.strictObject({
//       headers: mappedEntitySchema.optional(),
//       cookies: mappedEntitySchema.optional(),
//       params: mappedEntitySchema.optional(),
//       queries: mappedEntitySchema.optional(),
//       ...(isMethodWithBody && { body: bodyPlainEntitySchema.optional() })
//     })
//   );
// };

const baseRouteConfigSchema = () =>
  z.strictObject({
    // TODO: update and use entitiesByEntityNameSchema instead
    entities: z.any(),
    interceptors: plainObjectSchema(interceptorsSchema).optional()
  });

const dataRouteConfigSchema = () =>
  z
    .strictObject({
      settings: plainObjectSchema(
        settingsSchema.extend({ polling: z.literal(false).optional() })
      ).optional(),
      data: z.union([z.function(), z.any()])
    })
    .merge(baseRouteConfigSchema());

const fileRouteConfigSchema = () =>
  z
    .strictObject({
      settings: plainObjectSchema(
        settingsSchema.extend({ polling: z.literal(false).optional() })
      ).optional(),
      file: z.string()
    })
    .merge(baseRouteConfigSchema());

const queueRouteConfigSchema = () =>
  z
    .strictObject({
      settings: settingsSchema.extend({ polling: z.literal(true) }),
      queue: queueSchema
    })
    .merge(baseRouteConfigSchema());

export const routeConfigSchema = () =>
  z.union([
    z
      .custom(
        (value) => isPlainObject(value) && isOnlyRequestedDataResolvingPropertyExists(value, 'data')
      )
      .pipe(dataRouteConfigSchema()),
    z
      .custom(
        (value) => isPlainObject(value) && isOnlyRequestedDataResolvingPropertyExists(value, 'file')
      )
      .pipe(fileRouteConfigSchema()),
    z
      .custom(
        (value) =>
          isPlainObject(value) && isOnlyRequestedDataResolvingPropertyExists(value, 'queue')
      )
      .pipe(queueRouteConfigSchema())
  ]);