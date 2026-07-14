interface RouteInterceptors {
  interceptors?: { request?: unknown; response?: unknown };
}

export const getConfigInterceptors = (config: MockServerComponent['configs'][number]) => {
  const levels = [
    'interceptors' in config ? config.interceptors : undefined,
    ...(config.routes as RouteInterceptors[]).map((route) => route.interceptors)
  ];

  const functions = levels
    .flatMap((interceptors) => [interceptors?.request, interceptors?.response])
    .filter(Boolean);

  return {
    request: levels.some((interceptors) => interceptors?.request),
    response: levels.some((interceptors) => interceptors?.response),
    count: functions.length
  };
};
