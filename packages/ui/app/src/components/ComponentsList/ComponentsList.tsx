import { ArrowDownToDotIcon, ArrowUpFromDotIcon, BracketsIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Tooltip } from '../Tooltip/Tooltip';
import { Typography } from '../Typography/Typography';

interface ComponentsListProps {
  components: MockServerComponent[];
}

export const ComponentsList = ({ components }: ComponentsListProps) => (
  <div className='flex w-full justify-center'>
    <div className='grid w-page grid-cols-4 gap-xl'>
      {components.map((component, index) => (
        <div
          key={`component-${component}-${index}`}
          className='flex flex-col bg-card rounded px-l py-m gap-l shadow cursor-pointer hover:shadow-light'
        >
          <div className='flex gap-m items-baseline'>
            <Typography className='text-foreground-secondary'>{`#${index}`}</Typography>
            <Typography affects='body-light'>{component.baseUrl ?? '-'}</Typography>
          </div>
          <Typography variant='h1'>{component.name ?? 'component'}</Typography>
          <div className='flex gap-m justify-end'>
            <Tooltip text='Request interceptors'>
              <ArrowDownToDotIcon
                className={`${component.interceptors?.request ? 'stroke-accent' : 'stroke-foreground-secondary'} h-icon-m stroke-[3px]`}
              />
            </Tooltip>
            <Tooltip text='Response interceptors'>
              <ArrowUpFromDotIcon
                className={`${component.interceptors?.response ? 'stroke-accent' : 'stroke-foreground-secondary'} h-icon-m stroke-[3px]`}
              />
            </Tooltip>
            <Tooltip text='Configs'>
              <div className='flex'>
                <BracketsIcon
                  className={`${component.configs.length ? 'stroke-accent' : 'stroke-foreground-secondary'} h-icon-m stroke-[3px]`}
                />
                <Typography
                  className={cn(
                    'text-foreground-secondary',
                    !!component.configs.length && 'text-accent'
                  )}
                  affects='body-light'
                >
                  {component.configs.length}
                </Typography>
              </div>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  </div>
);
