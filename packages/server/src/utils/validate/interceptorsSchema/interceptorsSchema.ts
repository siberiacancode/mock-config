import { z } from 'zod';

import type { RequestInterceptor, ResponseInterceptor } from '@/utils/types';

import { isInterceptor } from '@/utils/helpers';

export const interceptorsSchema = z
  .array(z.custom<RequestInterceptor | ResponseInterceptor>(isInterceptor))
  .optional();
