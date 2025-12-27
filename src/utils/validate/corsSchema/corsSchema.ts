import { z } from 'zod';

const stringOrRegExpSchema = z.union([z.string(), z.instanceof(RegExp)]);
const originSchema = z.union([stringOrRegExpSchema, z.array(stringOrRegExpSchema), z.function()]);

export const corsSchema = z.strictObject({
  origin: originSchema,
  methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])).optional(),
  allowedHeaders: z.array(z.string()).optional(),
  exposedHeaders: z.array(z.string()).optional(),
  credentials: z.boolean().optional(),
  maxAge: z.number().int().positive().optional()
});
