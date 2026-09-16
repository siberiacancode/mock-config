import { getConfigTransport } from './transports';

type RequestConfig = MockServerComponent['configs'][number];
type RouteConfig = RequestConfig['routes'][number];

export const mergeComponentConfigs = (components: MockServerComponent[]): MockServerComponent[] =>
  components.map((component) => {
    const configs = new Map<string, RequestConfig>();
    const routes = new Map<string, RouteConfig[]>();

    component.configs.forEach((config) => {
      const key = getConfigTransport(config)?.endpointKey ?? 'unknown';

      if (!configs.has(key)) configs.set(key, config);
      routes.set(key, [...(routes.get(key) ?? []), ...config.routes]);
    });

    return {
      ...component,
      configs: [...configs].map(([key, config]) => ({
        ...config,
        routes: routes.get(key)
      })) as MockServerComponent['configs']
    };
  });
