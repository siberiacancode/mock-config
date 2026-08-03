import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const Accordion = ({ ...props }: AccordionPrimitive.Root.Props) => (
  <AccordionPrimitive.Root data-slot='accordion' {...props} />
);

const AccordionItem = ({ className, ...props }: AccordionPrimitive.Item.Props) => (
  <AccordionPrimitive.Item className={cn(className)} data-slot='accordion-item' {...props} />
);

const AccordionTrigger = ({ className, children, ...props }: AccordionPrimitive.Trigger.Props) => (
  <AccordionPrimitive.Header className='flex'>
    <AccordionPrimitive.Trigger
      className={cn(
        'flex flex-1 cursor-pointer items-center gap-1.5 text-left transition-all [&>svg]:-rotate-90 [&>svg]:transition-transform [&>svg]:duration-200 [&[data-panel-open]>svg]:rotate-0',
        className
      )}
      data-slot='accordion-trigger'
      {...props}
    >
      <ChevronDownIcon className='size-3.5 shrink-0' />
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);

const AccordionContent = ({ className, children, ...props }: AccordionPrimitive.Panel.Props) => (
  <AccordionPrimitive.Panel
    className={cn(
      'h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0',
      className
    )}
    data-slot='accordion-content'
    {...props}
  >
    {children}
  </AccordionPrimitive.Panel>
);

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
