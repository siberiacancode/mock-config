import type { Interceptor } from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

export const isInterceptor = (value: unknown): value is Interceptor =>
  typeof value === 'function' && INTERCEPTOR_NAME in value;
