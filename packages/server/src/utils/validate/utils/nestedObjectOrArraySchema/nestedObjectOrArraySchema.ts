import { z } from 'zod';

import type { NestedObjectOrArray } from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

export const nestedObjectOrArraySchema = <Value>(
  valueSchema: z.ZodType<Value>
): z.ZodType<NestedObjectOrArray<Value>> => {
  const nestedValueSchema = z.union([
    valueSchema,
    z.lazy(() => nestedObjectOrArraySchema(valueSchema))
  ]);

  return z.union([
    z.array(nestedValueSchema),
    z.record(nestedValueSchema).and(z.custom((value) => isPlainObject(value)))
  ]);
};
