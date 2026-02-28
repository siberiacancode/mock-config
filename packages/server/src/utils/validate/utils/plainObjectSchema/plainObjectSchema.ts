import { z } from 'zod';

// ✅ important:
// this schema is needed because zod handle RegExps as plain object
export const plainObjectSchema = (schema: z.ZodTypeAny) =>
  z.custom((value) => !(value instanceof RegExp)).pipe(schema);
