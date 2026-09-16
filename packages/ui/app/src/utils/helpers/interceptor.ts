type RequestConfig = MockServerComponent['configs'][number];

export type InterceptorLevel = 'component' | 'server';
export type InterceptorPhase = 'request' | 'response';

export interface SerializedInterceptor {
  $interceptor: string;
  code: string;
}

export interface InterceptorEntry {
  applied: boolean;
  code: string;
  level: InterceptorLevel;
  name: string;
  phase: InterceptorPhase;
}

const WS_TYPE_TARGETS: Record<string, string[]> = {
  connection: ['open'],
  raw: ['message', 'raw'],
  error: ['error'],
  close: ['close']
};

export const isSerializedInterceptor = (value: unknown): value is SerializedInterceptor =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as SerializedInterceptor).$interceptor === 'string' &&
  typeof (value as SerializedInterceptor).code === 'string';

export const getSerializedInterceptors = (interceptors: unknown): SerializedInterceptor[] =>
  Array.isArray(interceptors) ? interceptors.filter(isSerializedInterceptor) : [];

export const getInterceptorPhase = (name: string): InterceptorPhase | undefined => {
  const phase = name.split('.')[1];
  return phase === 'request' || phase === 'response' ? phase : undefined;
};

const getInterceptorTargets = (config: RequestConfig): [scope: string, target: string][] => {
  if ('method' in config)
    return [
      ['http', 'all'],
      ['rest', 'all'],
      ['rest', config.method]
    ];

  if ('operationType' in config && config.operationType === 'subscription')
    return [
      ['ws', 'all'],
      ['ws', 'message'],
      ['graphql', 'subscription']
    ];

  if ('operationType' in config)
    return [
      ['http', 'all'],
      ['graphql', 'all'],
      ['graphql', config.operationType]
    ];

  if ('type' in config)
    return [
      ['ws', 'all'],
      ...(WS_TYPE_TARGETS[config.type] ?? []).map((target): [string, string] => ['ws', target])
    ];

  return [];
};

export const isInterceptorApplied = (config: RequestConfig, name: string) => {
  const phase = getInterceptorPhase(name);
  if (!phase) return false;

  return getInterceptorTargets(config).some(
    ([scope, target]) => `${scope}.${phase}.${target}` === name
  );
};

export const getInterceptorEntries = (
  config: RequestConfig,
  { component, server }: { component?: unknown; server?: unknown }
): InterceptorEntry[] => {
  const toEntries = (level: InterceptorLevel, interceptors: unknown) =>
    getSerializedInterceptors(interceptors).flatMap((interceptor): InterceptorEntry[] => {
      const phase = getInterceptorPhase(interceptor.$interceptor);
      if (!phase) return [];

      return [
        {
          level,
          phase,
          name: interceptor.$interceptor,
          code: interceptor.code,
          applied: isInterceptorApplied(config, interceptor.$interceptor)
        }
      ];
    });

  const componentEntries = toEntries('component', component);
  const serverEntries = toEntries('server', server);
  const byPhase = (entries: InterceptorEntry[], phase: InterceptorPhase) =>
    entries.filter((entry) => entry.phase === phase);

  return [
    ...byPhase(serverEntries, 'request'),
    ...byPhase(componentEntries, 'request'),
    ...byPhase(componentEntries, 'response'),
    ...byPhase(serverEntries, 'response')
  ];
};
