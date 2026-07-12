import { Link } from '@tanstack/react-router';
import { ArrowDownToDotIcon, ArrowRightIcon, ArrowUpFromDotIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getConfigLabel, getConfigMethod } from '@/utils/helpers';

import { MethodBadge } from '../MethodBadge/MethodBadge';

const PREVIEW_CONFIGS_COUNT = 4;

interface ComponentCardProps {
  component: MockServerComponent;
  index: number;
}

export const ComponentCard = ({ component, index }: ComponentCardProps) => {
  const previewConfigs = component.configs.slice(0, PREVIEW_CONFIGS_COUNT);
  const restConfigsCount = component.configs.length - previewConfigs.length;

  const routesCount = component.configs.reduce((count, config) => count + config.routes.length, 0);
  const hasRequestInterceptor = Boolean(component.interceptors?.request);
  const hasResponseInterceptor = Boolean(component.interceptors?.response);
  const hasInterceptors = hasRequestInterceptor || hasResponseInterceptor;

  return (
    <Link
      className='group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground-secondary/40'
      to='/routes'
    >
      <div className='flex items-center gap-2.5 border-b border-border/60 px-4 py-3.5'>
        <span className='text-[15px] font-semibold text-foreground'>
          {component.name ?? `component #${index}`}
        </span>
        <span className='rounded-md border border-border bg-background-secondary px-2 py-0.5 font-code text-[11px] text-foreground-secondary'>
          baseUrl {String(component.baseUrl ?? '/')}
        </span>
        <ArrowRightIcon className='ml-auto size-4 text-foreground-secondary opacity-0 transition-opacity group-hover:opacity-100' />
      </div>

      <div className='flex flex-1 flex-col py-1.5'>
        {previewConfigs.map((config, configIndex) => (
          <div
            key={`${config.routes.length}-${configIndex}`}
            className='flex items-center gap-2.5 px-4 py-1.5 font-code text-[13px] text-foreground-secondary'
          >
            <MethodBadge className='shrink-0' method={getConfigMethod(config)} />
            <span className='truncate'>{getConfigLabel(config)}</span>
            <span className='ml-auto shrink-0 text-[11px]'>
              {config.routes.length} {config.routes.length === 1 ? 'route' : 'routes'}
            </span>
          </div>
        ))}
        {Boolean(restConfigsCount) && (
          <div className='px-4 py-1.5 font-code text-xs text-accent'>+{restConfigsCount} more…</div>
        )}
      </div>

      <div className='flex items-center gap-4 border-t border-border/60 bg-background-secondary px-4 py-2.5 text-xs text-foreground-secondary'>
        <span>
          {component.configs.length} {component.configs.length === 1 ? 'request' : 'requests'}
        </span>
        <span>
          {routesCount} {routesCount === 1 ? 'route' : 'routes'}
        </span>
        <span className='ml-auto flex items-center gap-1.5'>
          <ArrowDownToDotIcon className={cn('size-3.5', hasRequestInterceptor && 'text-accent')} />
          <ArrowUpFromDotIcon className={cn('size-3.5', hasResponseInterceptor && 'text-accent')} />
          {hasInterceptors ? 'interceptors' : 'no interceptors'}
        </span>
      </div>
    </Link>
  );
};
