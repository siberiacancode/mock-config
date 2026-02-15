import { z } from 'zod';

import { stringForwardSlashSchema } from '../utils';

const staticPathObjectSchema = z.strictObject({
  prefix: stringForwardSlashSchema,
  path: stringForwardSlashSchema
});

const staticPathStringOrObjectSchema = z.union([stringForwardSlashSchema, staticPathObjectSchema]);

export const staticPathSchema = z.union([
  staticPathStringOrObjectSchema,
  z.array(staticPathStringOrObjectSchema)
]);
