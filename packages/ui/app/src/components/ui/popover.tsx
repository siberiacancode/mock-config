import { Popover as PopoverPrimitive } from '@base-ui/react/popover';

import { cn } from '@/lib/utils';

const Popover = ({ ...props }: PopoverPrimitive.Root.Props) => (
  <PopoverPrimitive.Root data-slot='popover' {...props} />
);

const PopoverTrigger = ({ ...props }: PopoverPrimitive.Trigger.Props) => (
  <PopoverPrimitive.Trigger data-slot='popover-trigger' {...props} />
);

const PopoverContent = ({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  children,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, 'align' | 'side' | 'sideOffset'>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Positioner align={align} className='z-50' side={side} sideOffset={sideOffset}>
      <PopoverPrimitive.Popup
        className={cn(
          'origin-(--transform-origin) rounded-xl border border-border bg-card shadow-md outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className
        )}
        data-slot='popover-content'
        {...props}
      >
        {children}
      </PopoverPrimitive.Popup>
    </PopoverPrimitive.Positioner>
  </PopoverPrimitive.Portal>
);

export { Popover, PopoverContent, PopoverTrigger };
