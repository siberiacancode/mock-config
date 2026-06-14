import type { RequestInterceptor, ResponseInterceptor } from '@/utils/types';

import { INTERCEPTOR_NAME } from '@/utils/constants';

export const isInterceptor = (value: unknown): value is RequestInterceptor | ResponseInterceptor =>
  typeof value === 'function' && INTERCEPTOR_NAME in value;
