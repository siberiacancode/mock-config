import { Link, Outlet, useNavigate, useSearch } from '@tanstack/react-router';

import { MethodBadge, SearchInput } from '@/components';
import { useConfig } from '@/utils/context';
import {
  getComponentName,
  getConfigInterceptors,
  getConfigLabel,
  getConfigMethod
} from '@/utils/helpers';

import { getRouteGroups } from './helpers';

export const RoutesPage = () => {
  const { components } = useConfig();
  const search = useSearch({ from: '/routes' });
  const navigate = useNavigate({ from: '/routes' });

  const query = (search.query ?? '').toLowerCase();

  const groups = getRouteGroups(components, query);

  const onSearchChange = (value: string) =>
    navigate({ to: '.', search: { query: value || undefined }, replace: true });

  return (
    <div className='flex h-full'>
      <div className='flex w-100 shrink-0 flex-col border-r border-border'>
        <div className='border-b border-border/60 p-3.5'>
          <SearchInput
            label='Search requests'
            placeholder='Search route by method, path…'
            value={search.query ?? ''}
            onChange={onSearchChange}
          />
        </div>

        <div className='flex-1 overflow-y-auto pb-4'>
          {!groups.length && (
            <div className='px-4 py-6 text-sm text-foreground-secondary'>
              Nothing matches «{search.query}»
            </div>
          )}

          {groups.map(({ component, componentIndex, configs }) => (
            <div key={component.name ?? componentIndex}>
              <div className='sticky top-0 z-10 flex items-baseline justify-between border-b border-border/60 bg-background px-4 pb-2 pt-3.5'>
                <span className='text-[13px] font-semibold text-foreground'>
                  {getComponentName(component, componentIndex)}
                </span>
                <span className='text-[11px] text-foreground-secondary'>
                  {configs.length} {configs.length === 1 ? 'request' : 'requests'}
                </span>
              </div>

              {configs.map(({ config, configIndex }) => {
                const interceptors = getConfigInterceptors(config);

                return (
                  <Link
                    key={configIndex}
                    activeProps={{
                      className: 'border-accent/50 bg-accent-secondary',
                      'data-active': ''
                    }}
                    className='group mx-2 my-0.5 flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 font-code text-[13px] text-foreground'
                    inactiveProps={{ className: 'hover:bg-card' }}
                    params={{ requestId: `${componentIndex}-${configIndex}` }}
                    search={(prev) => prev}
                    to='/routes/$requestId'
                  >
                    <MethodBadge className='shrink-0' method={getConfigMethod(config)} />
                    <span className='truncate'>{getConfigLabel(config)}</span>
                    <span className='ml-auto flex shrink-0 items-center gap-1.5'>
                      {Boolean(interceptors.count) && (
                        <span className='rounded-full border border-border bg-background-secondary px-2 py-0.5 text-[11px] font-medium text-foreground-secondary'>
                          {interceptors.count}
                          {interceptors.count === 1 ? 'interceptor' : 'interceptors'}
                        </span>
                      )}
                      <span className='rounded-full border border-border bg-background-secondary px-2 py-0.5 text-[11px] font-medium text-foreground-secondary'>
                        {config.routes.length} {config.routes.length === 1 ? 'route' : 'routes'}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className='min-w-0 flex-1 overflow-y-auto'>
        <Outlet />
      </div>
    </div>
  );
};
