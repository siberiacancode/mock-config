import { Link, useParams } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';

import { EmptyState, MethodBadge, Typography } from '@/components';
import { cn } from '@/lib/utils';
import { TABLE_CLASS, TABLE_HEAD_CLASS, TABLE_ROW_CLASS } from '@/utils/constants';
import { useConfig } from '@/utils/context';
import {
  API_TYPE_LABELS,
  getComponentName,
  getConfigApiType,
  getConfigLabel,
  getConfigMethod,
  getRoutesCount
} from '@/utils/helpers';

const TABLE_GRID_CLASS = 'grid grid-cols-[100px_2fr_1fr_100px] items-center gap-4 px-4';

export const ComponentPage = () => {
  const { components } = useConfig();
  const { componentId } = useParams({ from: '/components/$componentId' });

  const componentIndex = Number(componentId);
  const component = components[componentIndex];

  if (!component) {
    return (
      <EmptyState
        description='The config has changed — pick a component from the list again'
        title='Component not found'
      />
    );
  }

  const routesCount = getRoutesCount([component]);

  return (
    <div className='flex flex-col gap-l p-7'>
      <div className='flex flex-col gap-2'>
        <Link
          className='flex w-fit items-center gap-1 text-[13px] text-foreground-secondary hover:text-foreground'
          search={(prev) => prev}
          to='/components'
        >
          <ChevronLeftIcon className='size-3.5' />
          Components
        </Link>
        <div className='flex items-baseline gap-3'>
          <Typography className='font-code' variant='h1'>
            {getComponentName(component, componentIndex)}
          </Typography>
          <span className='rounded-md border border-border bg-background-secondary px-2 py-0.5 font-code text-[11px] text-foreground-secondary'>
            baseUrl {String(component.baseUrl ?? '/')}
          </span>
        </div>
        <Typography affects='body-regular' className='text-foreground-secondary'>
          {component.configs.length} {component.configs.length === 1 ? 'request' : 'requests'} ·{' '}
          {routesCount} {routesCount === 1 ? 'route' : 'routes'}
        </Typography>
      </div>

      <div className='flex flex-col gap-2'>
        <span className='font-code text-[11px] uppercase tracking-wider text-foreground-secondary'>
          Routes
        </span>
        <div className={TABLE_CLASS}>
          <div className={cn(TABLE_GRID_CLASS, TABLE_HEAD_CLASS)}>
            <span>Method</span>
            <span>Path / Operation</span>
            <span>Transport</span>
            <span className='text-right'>Routes</span>
          </div>

          {component.configs.map((config, configIndex) => (
            <Link
              key={`${config.routes.length}-${configIndex}`}
              className={cn(
                TABLE_GRID_CLASS,
                TABLE_ROW_CLASS,
                'cursor-pointer font-code text-[13px]'
              )}
              params={{ requestId: `${componentIndex}-${configIndex}` }}
              to='/routes/$requestId'
            >
              <span>
                <MethodBadge method={getConfigMethod(config)} />
              </span>
              <span className='truncate text-foreground'>{getConfigLabel(config)}</span>
              <span className='text-foreground-secondary'>
                {API_TYPE_LABELS[getConfigApiType(config)]}
              </span>
              <span className='text-right text-foreground-secondary'>
                {config.routes.length} {config.routes.length === 1 ? 'route' : 'routes'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
