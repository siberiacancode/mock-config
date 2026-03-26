import { z } from 'zod';

import type { PlainObject } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

export const requiredPropertiesSchema = <T extends PlainObject>(
  schema: z.ZodType<T>,
  requiredProperties: (keyof T)[]
) =>
  z
    .custom(
      (value) =>
        isPlainObject(value) &&
        requiredProperties.every((property) =>
          Object.prototype.hasOwnProperty.call(value, property)
        )
    )
    .pipe(schema);
