import { z } from 'zod';

export const queueSchema = z.array(
  z.strictObject({
    time: z.number().int().nonnegative().optional(),
    data: z.union([z.function(), z.any()])
  })
);
