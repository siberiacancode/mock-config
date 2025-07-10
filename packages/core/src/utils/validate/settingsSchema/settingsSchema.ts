import { z } from 'zod';

export const settingsSchema = z.strictObject({
  polling: z.boolean().optional(),
  status: z.number().min(200).max(599).optional(),
  delay: z.number().nonnegative().optional()
});
