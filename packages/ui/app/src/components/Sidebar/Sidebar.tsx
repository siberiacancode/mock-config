import { DatabaseIcon, LayoutGridIcon, ListIcon, SettingsIcon, WorkflowIcon } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import type { Method } from '../MethodBadge/MethodBadge';

import { MethodBadge } from '../MethodBadge/MethodBadge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui';

type ConfigEntry = MockServerComponent['configs'][number];

const getConfigMethod = (config: ConfigEntry): Method => {
  if ('method' in config) return config.method;
  if ('operationType' in config) return config.operationType;
  return 'ws';
};

const getConfigLabel = (config: ConfigEntry) => {
  if ('path' in config) return String(config.path);
  if ('operationName' in config && config.operationName) return String(config.operationName);
  if ('operationType' in config) return String(config.operationType);
  return 'connection';
};

const NAV_LABEL_CLASS =
  'px-3 pt-2.5 pb-1.5 text-xs font-medium uppercase tracking-wider text-foreground-secondary';

const NAV_ITEM_CLASS =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-foreground-secondary [&_svg]:size-icon-l';

interface SidebarProps {
  components: MockServerComponent[];
}

export const Sidebar = ({ components }: SidebarProps) => {
  const [selectedConfig, setSelectedConfig] = useState<string>();

  const requestsCount = components.reduce(
    (count, component) => count + component.configs.length,
    0
  );

  return (
    <aside className='flex w-72 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border bg-background-secondary p-4'>
      <div className={NAV_LABEL_CLASS}>Inspect</div>
      <div className={cn(NAV_ITEM_CLASS, 'bg-accent-secondary text-accent')}>
        <ListIcon />
        Routes
        <span className='ml-auto rounded-full bg-card px-2 text-xs text-foreground-secondary'>
          {requestsCount}
        </span>
      </div>
      <div className={cn(NAV_ITEM_CLASS, 'cursor-pointer hover:bg-card')}>
        <LayoutGridIcon />
        Components
        <span className='ml-auto rounded-full bg-card px-2 text-xs text-foreground-secondary'>
          {components.length}
        </span>
      </div>
      <div className={cn(NAV_ITEM_CLASS, 'cursor-pointer hover:bg-card')}>
        <SettingsIcon />
        Settings
      </div>

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
              {component.configs.map((config, configIndex) => {
                const id = `${componentIndex}-${configIndex}`;

                return (
                  <div
                    key={id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg py-2 pl-7 pr-3 font-code text-[13px]',
                      selectedConfig === id
                        ? 'bg-accent-secondary text-accent'
                        : 'text-foreground-secondary hover:bg-card'
                    )}
                    onClick={() => setSelectedConfig(id)}
                  >
                    <MethodBadge method={getConfigMethod(config)} />
                    {getConfigLabel(config)}
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
};
