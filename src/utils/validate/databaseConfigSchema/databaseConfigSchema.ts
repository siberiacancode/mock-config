import { z } from 'zod';

import { stringForwardSlashSchema, stringJsonFilenameSchema } from '../utils';

export const databaseConfigSchema = z.strictObject({
  data: z.union([z.record(z.string(), z.unknown()), stringJsonFilenameSchema]),
  routes: z
    .union([z.record(stringForwardSlashSchema, stringForwardSlashSchema), stringJsonFilenameSchema])
    .optional()
});
