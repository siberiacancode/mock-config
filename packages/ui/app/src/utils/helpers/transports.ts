import type { Method } from '@/components/MethodBadge/MethodBadge';

type RequestConfig = MockServerComponent['configs'][number];

type RestConfig = Extract<RequestConfig, { method: string }>;
type GraphqlConfig = Extract<RequestConfig, { operationType: 'mutation' | 'query' }>;
type GraphqlWsConfig = Extract<RequestConfig, { operationType: 'subscription' }>;
type WsConfig = Extract<RequestConfig, { type: string }>;

export type ConfigApiType = 'graphql-ws' | 'graphql' | 'rest' | 'ws';

export interface TransportGroup {
  label: string;
  shortLabel: string;
}

export interface ConfigTransport {
  apiType: ConfigApiType;
  configLabel: string;
  endpointKey: string;
  group: TransportGroup;
  hasStatus: boolean;
  isRealtime: boolean;
  label: string;
  method: Method;
}

type TransportProperties = Omit<ConfigTransport, 'configLabel' | 'endpointKey' | 'method'>;

interface TransportDescriptor<Config extends RequestConfig> extends TransportProperties {
  getEndpointKey: (config: Config) => string;
  getLabel: (config: Config) => string;
  getMethod: (config: Config) => Method;
  matches: (config: RequestConfig) => config is Config;
}

interface Transport extends TransportProperties {
  resolve: (config: RequestConfig) => ConfigTransport | undefined;
}

const createTransport = <Config extends RequestConfig>({
  getEndpointKey,
  getLabel,
  getMethod,
  matches,
  ...properties
}: TransportDescriptor<Config>): Transport => ({
  ...properties,
  resolve: (config) =>
    matches(config)
      ? {
          ...properties,
          configLabel: getLabel(config),
          endpointKey: getEndpointKey(config),
          method: getMethod(config)
        }
      : undefined
});

const REST_GROUP: TransportGroup = { label: 'REST', shortLabel: 'REST' };
const GRAPHQL_GROUP: TransportGroup = { label: 'GraphQL', shortLabel: 'GQL' };
const WS_GROUP: TransportGroup = { label: 'WebSocket', shortLabel: 'WS' };

const REST_TRANSPORT = createTransport<RestConfig>({
  apiType: 'rest',
  group: REST_GROUP,
  hasStatus: true,
  isRealtime: false,
  label: 'REST',
  getEndpointKey: (config) => `rest:${config.method}:${String(config.path)}`,
  getLabel: (config) => String(config.path),
  getMethod: (config) => config.method,
  matches: (config): config is RestConfig => 'method' in config
});

const GRAPHQL_TRANSPORT = createTransport<GraphqlConfig>({
  apiType: 'graphql',
  group: GRAPHQL_GROUP,
  hasStatus: true,
  isRealtime: false,
  label: 'GraphQL',
  getEndpointKey: (config) => `graphql:${config.operationType}:${String(config.identifier)}`,
  getLabel: (config) => String(config.identifier),
  getMethod: (config) => config.operationType,
  matches: (config): config is GraphqlConfig =>
    'operationType' in config && config.operationType !== 'subscription'
});

const GRAPHQL_WS_TRANSPORT = createTransport<GraphqlWsConfig>({
  apiType: 'graphql-ws',
  group: GRAPHQL_GROUP,
  hasStatus: true,
  isRealtime: true,
  label: 'GraphQL WS',
  getEndpointKey: (config) => `graphql:${config.operationType}:${String(config.identifier)}`,
  getLabel: (config) => String(config.identifier),
  getMethod: (config) => config.operationType,
  matches: (config): config is GraphqlWsConfig =>
    'operationType' in config && config.operationType === 'subscription'
});

const WS_TRANSPORT = createTransport<WsConfig>({
  apiType: 'ws',
  group: WS_GROUP,
  hasStatus: false,
  isRealtime: true,
  label: 'WS',
  getEndpointKey: (config) => `ws:${config.type}`,
  getLabel: (config) => (config.type === 'raw' ? 'raw' : 'connection'),
  getMethod: () => 'ws',
  matches: (config): config is WsConfig => 'type' in config
});

const TRANSPORTS: Transport[] = [
  REST_TRANSPORT,
  GRAPHQL_TRANSPORT,
  GRAPHQL_WS_TRANSPORT,
  WS_TRANSPORT
];

export const API_TYPE_LABELS: Record<ConfigApiType, string> = {
  rest: REST_TRANSPORT.label,
  graphql: GRAPHQL_TRANSPORT.label,
  'graphql-ws': GRAPHQL_WS_TRANSPORT.label,
  ws: WS_TRANSPORT.label
};

export const getConfigTransport = (config: RequestConfig): ConfigTransport | undefined => {
  for (const transport of TRANSPORTS) {
    const resolved = transport.resolve(config);
    if (resolved) return resolved;
  }

  return undefined;
};

export const getConfigApiType = (config: RequestConfig): ConfigApiType =>
  getConfigTransport(config)?.apiType ?? 'ws';

export const getConfigLabel = (config: RequestConfig) =>
  getConfigTransport(config)?.configLabel ?? 'unknown';

export const getConfigMethod = (config: RequestConfig): Method =>
  getConfigTransport(config)?.method ?? 'ws';

export const getTransports = (components: MockServerComponent[]): TransportGroup[] => {
  const apiTypes = new Set(
    components.flatMap((component) =>
      component.configs.flatMap((config) => getConfigTransport(config)?.apiType ?? [])
    )
  );

  return [
    ...new Set(
      TRANSPORTS.filter((transport) => apiTypes.has(transport.apiType)).map(
        (transport) => transport.group
      )
    )
  ];
};
