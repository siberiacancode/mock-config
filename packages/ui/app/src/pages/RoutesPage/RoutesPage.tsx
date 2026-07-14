import { Link, Outlet, useNavigate, useSearch } from '@tanstack/react-router';
import { SearchIcon } from 'lucide-react';

import { MethodBadge, Typography } from '@/components';
import { useConfig } from '@/utils/context';
import { getConfigInterceptors, getConfigLabel, getConfigMethod } from '@/utils/helpers';

export const RoutesIndexPage = () => (
  <div className='flex h-full flex-col items-center justify-center gap-1 text-center'>
    <Typography variant='h1'>No request selected</Typography>
    <Typography className='text-foreground-secondary'>
      Pick a request from the list to inspect its routes
    </Typography>
  </div>
);

export const RoutesPage = () => {
  const { components } = useConfig();
  const search = useSearch({ from: '/routes' });
  const navigate = useNavigate({ from: '/routes' });

  const query = (search.query ?? '').toLowerCase();

  const groups = components
    .map((component, componentIndex) => ({
      component,
      componentIndex,
      configs: component.configs
        .map((config, configIndex) => ({ config, configIndex }))
        .filter(({ config }) => {
          if (!query) return true;

          const haystack =
            `${component.name ?? ''} ${getConfigMethod(config)} ${getConfigLabel(config)}`.toLowerCase();
          return haystack.includes(query);
        })
    }))
    .filter((group) => group.configs.length > 0);

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    navigate({
      to: '.',
      search: { query: event.target.value ?? undefined },
      replace: true
    });

  return (
    <div className='flex h-full'>
      <div className='flex w-100 shrink-0 flex-col border-r border-border'>
        <div className='border-b border-border/60 p-3.5'>
          <label className='flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground-secondary focus-within:border-ring'>
            <SearchIcon className='size-4 shrink-0' />
            <input
              className='w-full bg-transparent text-foreground outline-none placeholder:text-foreground-secondary'
              placeholder='Search by component, method, path…'
              type='text'
              value={search.query ?? ''}
              onChange={onSearchChange}
            />
          </label>
        </div>

        <div className='flex-1 overflow-y-auto pb-4'>
          {!groups.length && (
            <div className='px-4 py-6 text-sm text-foreground-secondary'>
              Nothing matches «{search.query}»
            </div>
          )}

          {groups.map(({ component, componentIndex, configs }) => (
            <div key={component.name ?? componentIndex}>
              <div className='sticky top-0 z-10 flex items-baseline gap-2 border-b border-border/60 bg-background px-4 pb-2 pt-3.5'>
                <span className='text-[13px] font-semibold text-foreground'>
                  {component.name ?? `component #${componentIndex}`}
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
                    activeProps={{ className: 'bg-card shadow-[inset_2px_0_0] shadow-accent' }}
                    className='flex items-center gap-2.5 px-4 py-2.5 font-code text-[13px] text-foreground'
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
                          {interceptors.count}{' '}
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
