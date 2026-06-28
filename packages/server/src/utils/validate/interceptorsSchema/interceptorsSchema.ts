import { z } from 'zod';

import type { HttpRequestInterceptor, HttpResponseInterceptor } from '@/utils/types';

import { isInterceptor } from '@/utils/helpers';

export const interceptorsSchema = z.array(
  z.custom<HttpRequestInterceptor | HttpResponseInterceptor>(isInterceptor)
);
