import { z } from 'zod';

import type { Interceptor } from '@/utils/types';

import { isInterceptor } from '@/utils/helpers';

export const interceptorsSchema = z.array(z.custom<Interceptor>(isInterceptor));
