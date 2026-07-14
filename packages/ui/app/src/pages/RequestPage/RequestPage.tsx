import { useParams } from '@tanstack/react-router';
import { ArrowDownToDotIcon, ArrowUpFromDotIcon } from 'lucide-react';

import { MethodBadge, Tabs, TabsContent, TabsList, TabsTrigger, Typography } from '@/components';
import { useConfig } from '@/utils/context';
import { getConfigLabel, getConfigMethod } from '@/utils/helpers';

import { MatcherChip } from './MatcherChip';

interface RouteEntry {
  data?: unknown;
  entities?: Record<string, unknown>;
  interceptors?: { request?: unknown; response?: unknown };
  settings?: { delay?: number; status?: number };
}

interface InterceptorEntry {
  code: string;
  level: string;
  type: 'request' | 'response';
}

const isSerializedFunction = (value: unknown): value is string =>
  typeof value === 'string' && value.includes('=>');

interface RouteMatcher {
  label: string;
  value: string;
}

const getRouteMatchers = (route: RouteEntry): RouteMatcher[] => {
  if (!route.entities) return [];

  return Object.entries(route.entities).flatMap(([entityName, entityValue]) => {
    if (isSerializedFunction(entityValue)) {
      return [{ label: `${entityName} → comparator`, value: entityValue }];
    }
    if (typeof entityValue !== 'object' || entityValue === null) {
      return [
        {
          label: `${entityName} = ${JSON.stringify(entityValue)}`,
          value: JSON.stringify(entityValue, null, 2)
        }
      ];
    }
    if (entityName === 'body' || entityName === 'variables') {
      return [
        {
          label: `${entityName} = ${JSON.stringify(entityValue)}`,
          value: JSON.stringify(entityValue, null, 2)
        }
      ];
    }

    return Object.entries(entityValue).map(([key, value]) => {
      if (isSerializedFunction(value)) {
        return { label: `${entityName}.${key} → comparator`, value };
      }
      return {
        label: `${entityName}.${key} = ${JSON.stringify(value)}`,
        value: JSON.stringify(value, null, 2)
      };
    });
  });
};

const formatRouteData = (data: unknown) => {
  if (isSerializedFunction(data)) return data;
  return JSON.stringify(data, null, 2) ?? 'undefined';
};

const getConfigApiType = (config: MockServerComponent['configs'][number]) => {
  if ('method' in config) return 'rest';
  if ('operationType' in config)
    return config.operationType === 'subscription' ? 'graphql-ws' : 'graphql';
  return 'ws';
};

const getInterceptorEntries = (
  component: MockServerComponent,
  config: MockServerComponent['configs'][number],
  routes: RouteEntry[]
) => {
  const levels = [
    { level: 'component', interceptors: component.interceptors },
    { level: 'request', interceptors: 'interceptors' in config ? config.interceptors : undefined },
    ...routes.map((route, routeIndex) => ({
      level: `route #${routeIndex + 1}`,
      interceptors: route.interceptors
    }))
  ];

  return levels.flatMap((entry) => {
    if (!entry.interceptors) return [];

    return (['request', 'response'] as const)
      .filter((type) => entry.interceptors?.[type])
      .map(
        (type): InterceptorEntry => ({
          level: entry.level,
          type,
          code: String(entry.interceptors?.[type])
        })
      );
  });
};

export const RequestPage = () => {
  const { components } = useConfig();
  const { requestId } = useParams({ from: '/routes/$requestId' });

  const [componentIndex, configIndex] = requestId.split('-').map(Number);
  const component = components[componentIndex];
  const config = component?.configs[configIndex];

  if (!component || !config) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-1 text-center'>
        <Typography variant='h1'>Request not found</Typography>
        <Typography className='text-foreground-secondary'>
          The config has changed — pick a request from the list again
        </Typography>
      </div>
    );
  }

  const routes = config.routes as RouteEntry[];
  const interceptorEntries = getInterceptorEntries(component, config, routes);

  return (
    <div className='flex flex-col gap-l p-7'>
      <div className='flex flex-col gap-2'>
        <Typography affects='code-regular' className='text-foreground-secondary'>
          {component.name ?? `component #${componentIndex}`} / {getConfigApiType(config)}
        </Typography>
        <div className='flex items-center gap-3'>
          <MethodBadge className='px-2.5 py-1 text-xs' method={getConfigMethod(config)} />
          <span className='font-code text-xl font-semibold'>{getConfigLabel(config)}</span>
        </div>
        <Typography affects='body-regular' className='text-foreground-secondary'>
          {routes.length} {routes.length === 1 ? 'route' : 'routes'} · most specific match wins
        </Typography>
      </div>

      <Tabs defaultValue='routes'>
        <TabsList>
          <TabsTrigger value='routes'>
            Routes
            <span className='rounded-full bg-card px-1.5 text-[11px] text-foreground-secondary'>
              {routes.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value='interceptors'>
            Interceptors
            <span className='rounded-full bg-card px-1.5 text-[11px] text-foreground-secondary'>
              {interceptorEntries.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value='raw'>Raw config</TabsTrigger>
        </TabsList>

        <TabsContent value='routes'>
          <div className='flex flex-col gap-3.5'>
            {routes.map((route, routeIndex) => {
              const matchers = getRouteMatchers(route);

              return (
                <div
                  key={routeIndex}
                  className='overflow-hidden rounded-xl border border-border bg-card'
                >
                  <div className='flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3'>
                    <span className='font-code text-[11px] text-foreground-secondary'>
                      #{routeIndex + 1}
                    </span>

                    {matchers.map((matcher) => (
                      <MatcherChip
                        key={matcher.label}
                        label={matcher.label}
                        value={matcher.value}
                      />
                    ))}

                    <span className='ml-auto flex items-center gap-2'>
                      {!matchers.length && (
                        <span className='flex items-center gap-1 font-code text-[11px] text-additional-success'>
                          ● default
                        </span>
                      )}
                      {route.settings?.status && (
                        <span className='rounded-md bg-tag-2/15 px-2 py-0.5 font-code text-[11px] text-tag-2'>
                          {route.settings.status}
                        </span>
                      )}
                      {route.settings?.delay && (
                        <span className='rounded-md bg-tag-5/15 px-2 py-0.5 font-code text-[11px] text-tag-5'>
                          {route.settings.delay}ms
                        </span>
                      )}
                    </span>
                  </div>

                  <pre className='overflow-x-auto px-4 py-3.5 font-code text-[12.5px] leading-relaxed text-foreground-secondary'>
                    {formatRouteData(route.data)}
                  </pre>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value='interceptors'>
          {!interceptorEntries.length && (
            <Typography className='text-foreground-secondary'>
              This request has no interceptors on any level
            </Typography>
          )}

          <div className='flex flex-col gap-3.5'>
            {interceptorEntries.map((entry) => (
              <div
                key={`${entry.level}-${entry.type}`}
                className='overflow-hidden rounded-xl border border-border bg-card'
              >
                <div className='flex items-center gap-2 border-b border-border/60 px-4 py-3'>
                  {entry.type === 'request' && (
                    <ArrowDownToDotIcon className='size-3.5 text-accent' />
                  )}
                  {entry.type === 'response' && (
                    <ArrowUpFromDotIcon className='size-3.5 text-accent' />
                  )}
                  <span className='font-code text-xs text-foreground'>
                    {entry.type} interceptor
                  </span>
                  <span className='rounded-md border border-border bg-background-secondary px-2 py-0.5 font-code text-[11px] text-foreground-secondary'>
                    defined on {entry.level}
                  </span>
                </div>
                <pre className='overflow-x-auto px-4 py-3.5 font-code text-[12.5px] leading-relaxed text-foreground-secondary'>
                  {entry.code}
                </pre>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='raw'>
          <pre className='overflow-x-auto rounded-xl border border-border bg-card px-4 py-3.5 font-code text-[12.5px] leading-relaxed text-foreground-secondary'>
            {JSON.stringify(config, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};
