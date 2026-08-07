import { z } from 'zod';

import { plainObjectSchema, stringForwardSlashSchema, stringJsonFilenameSchema } from '../utils';

export const playgroundDataSchema = z.union([
  plainObjectSchema(z.record(z.unknown())),
  stringJsonFilenameSchema
]);

export const playgroundConfigSchema = z.strictObject({
  data: playgroundDataSchema,
  routes: z
    .union([
      plainObjectSchema(z.record(stringForwardSlashSchema, stringForwardSlashSchema)),
      stringJsonFilenameSchema
    ])
    .optional()
});
