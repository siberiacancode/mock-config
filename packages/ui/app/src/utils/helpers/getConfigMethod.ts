import type { Method } from '@/components/MethodBadge/MethodBadge';

export const getConfigMethod = (config: MockServerComponent['configs'][number]): Method => {
  if ('method' in config) return config.method;
  if ('operationType' in config) return config.operationType;
  return 'ws';
};
