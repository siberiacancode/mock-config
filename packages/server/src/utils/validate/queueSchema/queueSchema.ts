import { z } from 'zod';

// ✅ important:
// zod pass non-presented property as valid if one of possible values is undefined
// so firstly need to use custom check for property existence
export const queueSchema = z.array(
  z.union([
    z
      .custom((value) => 'data' in value)
      .pipe(
        z.strictObject({
          time: z.number().int().nonnegative().optional(),
          data: z.union([z.function(), z.any()])
        })
      ),
    z.strictObject({
      time: z.number().int().nonnegative().optional(),
      file: z.string()
    })
  ])
);
