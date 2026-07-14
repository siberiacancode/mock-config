import { Link } from '@tanstack/react-router';
import { DatabaseIcon, LayoutGridIcon, ListIcon, SettingsIcon, WorkflowIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getConfigLabel, getConfigMethod } from '@/utils/helpers';

import { MethodBadge } from '../MethodBadge/MethodBadge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui';

const NAV_LABEL_CLASS =
  'px-3 pt-2.5 pb-1.5 text-xs font-medium uppercase tracking-wider text-foreground-secondary';

const NAV_ITEM_CLASS =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-foreground-secondary [&_svg]:size-icon-l';

interface SidebarProps {
  components: MockServerComponent[];
}

export const Sidebar = ({ components }: SidebarProps) => {
  const requestsCount = components.reduce(
    (count, component) => count + component.configs.length,
    0
  );

  return (
    <aside className='flex w-72 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-background-secondary p-4'>
      <div className={NAV_LABEL_CLASS}>Inspect</div>
      <Link
        activeProps={{ className: 'bg-accent-secondary text-accent' }}
        className={NAV_ITEM_CLASS}
        inactiveProps={{ className: 'cursor-pointer hover:bg-card' }}
        to='/routes'
      >
        <ListIcon />
        Routes
        <span className='ml-auto rounded-full bg-card px-2 text-xs text-foreground-secondary'>
          {requestsCount}
        </span>
      </Link>
      <Link
        activeProps={{ className: 'bg-accent-secondary text-accent' }}
        className={NAV_ITEM_CLASS}
        inactiveProps={{ className: 'cursor-pointer hover:bg-card' }}
        to='/components'
      >
        <LayoutGridIcon />
        Components
        <span className='ml-auto rounded-full bg-card px-2 text-xs text-foreground-secondary'>
          {components.length}
        </span>
      </Link>
      <Link
        activeProps={{ className: 'bg-accent-secondary text-accent' }}
        className={NAV_ITEM_CLASS}
        inactiveProps={{ className: 'cursor-pointer hover:bg-card' }}
        to='/settings'
      >
        <SettingsIcon />
        Settings
      </Link>

      <div className={cn(NAV_LABEL_CLASS, 'mt-3')}>Coming soon</div>
      <div className={cn(NAV_ITEM_CLASS, 'opacity-45')}>
        <WorkflowIcon />
        Scenarios
        <span className='ml-auto rounded-sm border border-border px-1.5 text-[10px]'>soon</span>
      </div>
      <div className={cn(NAV_ITEM_CLASS, 'opacity-45')}>
        <DatabaseIcon />
        Database
        <span className='ml-auto rounded-sm border border-border px-1.5 text-[10px]'>soon</span>
      </div>

      <div className={cn(NAV_LABEL_CLASS, 'mt-3')}>Config tree</div>

      <Accordion multiple>
        {components.map((component, componentIndex) => (
          <AccordionItem key={component.name ?? componentIndex} value={componentIndex}>
            <AccordionTrigger className='w-full rounded-lg px-3 py-1.5 text-[13px] text-foreground-secondary hover:text-foreground'>
              {component.name ?? `component #${componentIndex}`}
            </AccordionTrigger>
            <AccordionContent>
              {component.configs.map((config, configIndex) => (
                <Link
                  key={`${config.routes.length}-${configIndex}`}
                  activeProps={{ className: 'bg-accent-secondary text-accent' }}
                  className='flex cursor-pointer items-center gap-2.5 rounded-lg py-2 pl-7 pr-3 font-code text-[13px]'
                  inactiveProps={{ className: 'text-foreground-secondary hover:bg-card' }}
                  params={{ requestId: `${componentIndex}-${configIndex}` }}
                  to='/routes/$requestId'
                >
                  <MethodBadge className='shrink-0' method={getConfigMethod(config)} />
                  <span className='truncate'>{getConfigLabel(config)}</span>
                </Link>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
};
