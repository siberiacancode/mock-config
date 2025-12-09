import { z } from 'zod';

import { plainObjectSchema, stringForwardSlashSchema, stringJsonFilenameSchema } from '../utils';

export const databaseConfigSchema = z.strictObject({
  data: z.union([plainObjectSchema(z.record(z.unknown())), stringJsonFilenameSchema]),
  routes: z
    .union([
      plainObjectSchema(z.record(stringForwardSlashSchema, stringForwardSlashSchema)),
      stringJsonFilenameSchema
    ])
    .optional()
});
