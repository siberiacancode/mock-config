import { useParams } from '@tanstack/react-router';
import { ArrowDownToDotIcon, ArrowUpFromDotIcon, PlayIcon } from 'lucide-react';
import { useState } from 'react';

import {
  EmptyState,
  MethodBadge,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Typography
} from '@/components';
import { useConfig } from '@/utils/context';
import {
  API_TYPE_LABELS,
  getComponentName,
  getConfigApiType,
  getConfigLabel,
  getConfigMethod,
  getConfigTransport
} from '@/utils/helpers';

import type { RouteEntry } from './types';

import { MatcherChip } from './components/MatcherChip/MatcherChip';
import { SendRequestDrawer } from './components/SendRequestDrawer/SendRequestDrawer';
import { formatRouteData, getInterceptorEntries, getRouteMatchers } from './helpers';

export const RequestPage = () => {
  const { components } = useConfig();
  const { requestId } = useParams({ from: '/routes/$requestId' });

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sendRouteIndex, setSendRouteIndex] = useState(0);

  const [componentIndex, configIndex] = requestId.split('-').map(Number);
  const component = components[componentIndex];
  const config = component?.configs[configIndex];

  if (!component || !config) {
    return (
      <EmptyState
        description='The config has changed — pick a request from the list again'
        title='Request not found'
      />
    );
  }

  const routes = config.routes as RouteEntry[];
  const apiType = getConfigApiType(config);
  const hasStatus = getConfigTransport(config)?.hasStatus ?? false;
  const interceptorEntries = getInterceptorEntries(component, config, routes);
  const isRestConfig = 'method' in config;

  return (
    <div className='flex flex-col gap-l p-7'>
      <div className='flex flex-col gap-2'>
        <Typography affects='code-regular' className='text-foreground-secondary'>
          {getComponentName(component, componentIndex)} / {apiType}
        </Typography>
        <div className='flex items-center gap-3'>
          <MethodBadge
            className='px-2.5 py-1 text-xs'
            method={getConfigMethod(config)}
            variant='active'
          />
          <span className='font-code text-xl font-semibold'>{getConfigLabel(config)}</span>
        </div>
        <Typography affects='body-regular' className='text-foreground-secondary'>
          {routes.length} {routes.length === 1 ? 'route' : 'routes'} · {API_TYPE_LABELS[apiType]}
        </Typography>
      </div>

      <Tabs defaultValue='routes'>
        <TabsList>
          <TabsTrigger value='routes'>
            Routes
            <span className='rounded-full bg-card px-1.5 text-[11px] text-foreground-secondary group-data-active:bg-accent group-data-active:text-accent-foreground'>
              {routes.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value='interceptors'>
            Interceptors
            <span className='rounded-full bg-card px-1.5 text-[11px] text-foreground-secondary group-data-active:bg-accent group-data-active:text-accent-foreground'>
              {interceptorEntries.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value='raw'>Raw config</TabsTrigger>
        </TabsList>

        <TabsContent value='routes'>
          <div className='flex flex-col gap-3.5'>
            {routes.map((route, routeIndex) => {
              const matchers = getRouteMatchers(route);
              const status = route.settings?.status ?? (hasStatus ? 200 : undefined);

              return (
                <div
                  key={routeIndex}
                  className='overflow-hidden rounded-xl border border-border bg-card'
                >
                  <div className='flex items-center gap-2 border-b border-border/60 px-4 py-3'>
                    <span className='font-code text-[11px] text-foreground-secondary'>
                      #{routeIndex + 1}
                    </span>

                    {!matchers.length && (
                      <span className='flex items-center gap-1.5 rounded-sm border border-border bg-background-secondary px-1.5 py-0.5 font-code text-[10px] text-foreground-secondary'>
                        <span className='size-1.5 rounded-full bg-accent' />
                        fallback
                      </span>
                    )}

                    <span className='ml-auto flex items-center gap-2'>
                      {isRestConfig && (
                        <button
                          className='flex cursor-pointer items-center gap-1 rounded-md bg-accent px-2 py-0.5 font-code text-[11px] font-medium text-accent-foreground hover:bg-accent/90'
                          type='button'
                          onClick={() => {
                            setSendRouteIndex(routeIndex);
                            setIsSendOpen(true);
                          }}
                        >
                          <PlayIcon className='size-3' />
                          Send
                        </button>
                      )}
                      {route.settings?.delay && (
                        <span className='rounded-md border border-border bg-background-secondary px-2 py-0.5 font-code text-[11px] text-foreground-secondary'>
                          {route.settings.delay}ms
                        </span>
                      )}
                      {status && <StatusBadge status={status} />}
                    </span>
                  </div>

                  {Boolean(matchers.length) && (
                    <div className='flex flex-col gap-2 border-b border-border/60 px-4 py-3'>
                      <span className='font-code text-[10px] uppercase tracking-wider text-foreground-secondary'>
                        Match when request
                      </span>
                      {matchers.map((matcher) => (
                        <div
                          key={`${matcher.entity}-${matcher.key ?? ''}-${matcher.value}`}
                          className='flex items-center gap-2 font-code text-xs'
                        >
                          <span className='rounded-sm border border-border bg-background-secondary px-1.5 py-0.5 text-[10px] text-foreground-secondary'>
                            {matcher.entity}
                          </span>
                          {matcher.key && <span className='text-foreground'>{matcher.key}</span>}
                          <span className='italic text-foreground-secondary'>
                            {matcher.operator}
                          </span>
                          {matcher.preview ? (
                            <MatcherChip label={matcher.value} value={matcher.preview} />
                          ) : (
                            <span className='text-accent'>{matcher.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className='px-4 pb-3.5 pt-3'>
                    <div className='pb-2 font-code text-[10px] uppercase tracking-wider text-foreground-secondary'>
                      Response
                    </div>
                    <pre className='overflow-x-auto font-code text-[12.5px] leading-relaxed text-foreground-secondary'>
                      {formatRouteData(route.data)}
                    </pre>
                  </div>
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

      {isRestConfig && (
        <SendRequestDrawer
          key={`${requestId}-${sendRouteIndex}`}
          componentBaseUrl={component.baseUrl}
          method={config.method}
          open={isSendOpen}
          path={String(config.path)}
          route={routes[sendRouteIndex]}
          onOpenChange={setIsSendOpen}
        />
      )}
    </div>
  );
};
