import { Buffer } from 'node:buffer';
import { z } from 'zod';

import type { FileDescriptor } from '@/utils/types';

export const isFileDescriptor = (value: any): value is FileDescriptor =>
  z
    .object({
      path: z.string(),
      file: z.instanceof(Buffer)
    })
    .strict()
    .safeParse(value).success;
