import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '@/lib/utils';

const Tabs = ({ ...props }: TabsPrimitive.Root.Props) => (
  <TabsPrimitive.Root data-slot='tabs' {...props} />
);

const TabsList = ({ className, ...props }: TabsPrimitive.List.Props) => (
  <TabsPrimitive.List
    className={cn('flex gap-0.5 border-b border-border', className)}
    data-slot='tabs-list'
    {...props}
  />
);

const TabsTrigger = ({ className, ...props }: TabsPrimitive.Tab.Props) => (
  <TabsPrimitive.Tab
    className={cn(
      '-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 border-transparent px-3.5 py-2 text-[13px] text-foreground-secondary transition-colors hover:text-foreground data-active:border-accent data-active:text-foreground',
      className
    )}
    data-slot='tabs-trigger'
    {...props}
  />
);

const TabsContent = ({ className, ...props }: TabsPrimitive.Panel.Props) => (
  <TabsPrimitive.Panel className={cn('pt-4', className)} data-slot='tabs-content' {...props} />
);

export { Tabs, TabsContent, TabsList, TabsTrigger };
