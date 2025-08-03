import { z } from 'zod';

export const interceptorsSchema = z.strictObject({
  request: z.instanceof(Function).optional(),
  response: z.instanceof(Function).optional()
});
