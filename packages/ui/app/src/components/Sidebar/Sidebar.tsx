import type { LucideIcon } from 'lucide-react';

import { Link } from '@tanstack/react-router';
import { DatabaseIcon, LayoutGridIcon, ListIcon, SettingsIcon, WorkflowIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  getComponentName,
  getConfigLabel,
  getConfigMethod,
  getRequestsCount
} from '@/utils/helpers';

import { MethodBadge } from '../MethodBadge/MethodBadge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui';

const NAV_LABEL_CLASS =
  'px-3 pt-2.5 pb-1.5 text-xs font-medium uppercase tracking-wider text-foreground-secondary';

const NAV_ITEM_CLASS =
  'flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-[15px] text-foreground-secondary [&_svg]:size-icon-l';

const NAV_ITEM_ACTIVE_CLASS =
  'border-accent/50 bg-accent-secondary text-foreground [&_svg]:text-accent';

const NAV_COUNTER_CLASS =
  'ml-auto rounded-md border border-border bg-background-secondary px-1.5 text-[11px] text-foreground-secondary';

const NAV_SOON_BADGE_CLASS = 'ml-auto rounded-sm border border-border px-1.5 text-[10px]';

interface InspectItem {
  icon: LucideIcon;
  label: string;
  to: '/components' | '/routes' | '/settings';
  getCount?: (components: MockServerComponent[]) => number;
}

const INSPECT_ITEMS: InspectItem[] = [
  { getCount: getRequestsCount, icon: ListIcon, label: 'Routes', to: '/routes' },
  {
    getCount: (components) => components.length,
    icon: LayoutGridIcon,
    label: 'Components',
    to: '/components'
  },
  { icon: SettingsIcon, label: 'Settings', to: '/settings' }
];

const COMING_SOON_ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: WorkflowIcon, label: 'Scenarios' },
  { icon: DatabaseIcon, label: 'Database' }
];

interface SidebarProps {
  className?: string;
  components: MockServerComponent[];
}

export const Sidebar = ({ components, className }: SidebarProps) => (
  <aside
    className={cn(
      'flex w-72 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-background-secondary p-4',
      className
    )}
  >
    <div className={NAV_LABEL_CLASS}>Inspect</div>
    {INSPECT_ITEMS.map(({ getCount, icon: Icon, label, to }) => (
      <Link
        key={to}
        activeProps={{ className: NAV_ITEM_ACTIVE_CLASS }}
        className={NAV_ITEM_CLASS}
        inactiveProps={{ className: 'cursor-pointer hover:bg-card' }}
        to={to}
      >
        <Icon />
        {label}
        {!!getCount && <span className={NAV_COUNTER_CLASS}>{getCount(components)}</span>}
      </Link>
    ))}

    <div className={cn(NAV_LABEL_CLASS, 'mt-3')}>Coming soon</div>
    {COMING_SOON_ITEMS.map(({ icon: Icon, label }) => (
      <div key={label} className={cn(NAV_ITEM_CLASS, 'opacity-45')}>
        <Icon />
        {label}
        <span className={NAV_SOON_BADGE_CLASS}>soon</span>
      </div>
    ))}

    <div className={cn(NAV_LABEL_CLASS, 'mt-3')}>Config tree</div>
    <Accordion multiple defaultValue={components.map((_, componentIndex) => componentIndex)}>
      {components.map((component, componentIndex) => (
        <AccordionItem key={component.name ?? componentIndex} value={componentIndex}>
          <AccordionTrigger className='w-full rounded-lg px-3 py-1.5 text-[13px] text-foreground-secondary hover:text-foreground'>
            {getComponentName(component, componentIndex)}
            {component.baseUrl && component.baseUrl !== '/' && (
              <span className='ml-1.5 truncate font-code text-[11px] opacity-60'>
                {String(component.baseUrl)}
              </span>
            )}
          </AccordionTrigger>
          <AccordionContent>
            {component.configs.map((config, configIndex) => (
              <Link
                key={configIndex}
                activeProps={{
                  className: 'border-accent/50 bg-accent-secondary text-foreground',
                  'data-active': ''
                }}
                className='group flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent py-2 pl-7 pr-3 font-code text-[13px]'
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
