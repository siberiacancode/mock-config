import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronRightIcon } from 'lucide-react';

import { SearchInput, Typography } from '@/components';
import { cn } from '@/lib/utils';
import { TABLE_CLASS, TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '@/utils/constants';
import { useConfig } from '@/utils/context';
import {
  getComponentInterceptors,
  getComponentName,
  getRequestsCount,
  getRoutesCount
} from '@/utils/helpers';

const TABLE_GRID_CLASS = 'grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 px-4';

export const ComponentsPage = () => {
  const { components } = useConfig();
  const search = useSearch({ from: '/components' });
  const navigate = useNavigate({ from: '/components' });

  const query = search.query ?? '';

  const onSearchChange = (value: string) =>
    navigate({ to: '.', search: { query: value || undefined }, replace: true });

  const filteredComponents = components
    .map((component, index) => ({ component, index }))
    .filter(({ component, index }) =>
      getComponentName(component, index).toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div className='flex flex-col gap-l p-7'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-baseline gap-3'>
          <Typography variant='h1'>Components</Typography>
          <Typography affects='body-regular' className='text-foreground-secondary'>
            {components.length} components · {getRequestsCount(components)} requests
          </Typography>
        </div>
        <Typography className='text-foreground-secondary'>
          Logical groups of routes from your mock server config. Click a component to open it.
        </Typography>
      </div>

      <SearchInput
        className='max-w-96'
        label='Filter components'
        placeholder='Filter components…'
        value={query}
        onChange={onSearchChange}
      />

      <div className={TABLE_CLASS}>
        <div className={cn(TABLE_GRID_CLASS, TABLE_HEAD_CLASS)}>
          <span>Component</span>
          <span>Base url</span>
          <span className='text-right'>Requests</span>
          <span className='text-right'>Routes</span>
          <span className='text-right'>Interceptors</span>
        </div>

        {!filteredComponents.length && (
          <div className='px-4 py-6 text-sm text-foreground-secondary'>
            Nothing matches «{query}»
          </div>
        )}

        {filteredComponents.map(({ component, index }) => {
          const interceptors = getComponentInterceptors(component);
          const interceptorLabels = [
            interceptors.request && 'request',
            interceptors.response && 'response'
          ].filter(Boolean);

          return (
            <Link
              key={component.name ?? index}
              className={cn(TABLE_GRID_CLASS, TABLE_ROW_CLASS, 'group cursor-pointer text-[13px]')}
              params={{ componentId: String(index) }}
              search={(prev) => prev}
              to='/components/$componentId'
            >
              <span className='flex items-center gap-1.5 font-code font-semibold text-foreground'>
                {getComponentName(component, index)}
                <ChevronRightIcon className='size-3.5 text-foreground-secondary opacity-0 transition-opacity group-hover:opacity-100' />
              </span>
              <span className='truncate font-code text-foreground-secondary'>
                {String(component.baseUrl ?? '/')}
              </span>
              <span className='text-right font-code text-foreground'>
                {component.configs.length}
              </span>
              <span className='text-right font-code text-foreground'>
                {getRoutesCount([component])}
              </span>
              <span className='text-right font-code text-accent'>
                {interceptorLabels.length ? (
                  interceptorLabels.join(', ')
                ) : (
                  <span className='text-foreground-secondary'>—</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
