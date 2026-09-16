import { getInterceptorEntries } from './interceptor';

export const getConfigInterceptors = (
  config: MockServerComponent['configs'][number],
  component: MockServerComponent,
  settings?: MockServerSettings
) => {
  const applied = getInterceptorEntries(config, {
    component: component.interceptors,
    server: settings?.interceptors
  }).filter((entry) => entry.applied);

  return {
    request: applied.some((entry) => entry.phase === 'request'),
    response: applied.some((entry) => entry.phase === 'response'),
    count: applied.length
  };
};
