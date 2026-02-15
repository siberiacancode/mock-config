import type { CorsOrigin } from '@/utils/types';

export const getAllowedOrigins = (origin: CorsOrigin): (string | RegExp)[] => {
  if (Array.isArray(origin)) {
    return origin;
  }

  if (typeof origin === 'string' || origin instanceof RegExp) {
    return [origin];
  }

  throw new Error('Invalid cors origin format');
};
