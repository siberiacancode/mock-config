import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';

import { cn } from '@/lib/utils';

const Drawer = ({ ...props }: DrawerPrimitive.Root.Props) => (
  <DrawerPrimitive.Root data-slot='drawer' swipeDirection='right' {...props} />
);

const DrawerTrigger = ({ ...props }: DrawerPrimitive.Trigger.Props) => (
  <DrawerPrimitive.Trigger data-slot='drawer-trigger' {...props} />
);

const DrawerClose = ({ ...props }: DrawerPrimitive.Close.Props) => (
  <DrawerPrimitive.Close data-slot='drawer-close' {...props} />
);

const DrawerContent = ({ className, children, ...props }: DrawerPrimitive.Popup.Props) => (
  <DrawerPrimitive.Portal>
    <DrawerPrimitive.Backdrop className='fixed inset-0 z-50 bg-black/60 opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-300 data-swiping:duration-0 data-ending-style:opacity-0 data-starting-style:opacity-0' />
    <DrawerPrimitive.Viewport className='fixed inset-0 z-50 flex justify-end'>
      <DrawerPrimitive.Popup
        className={cn(
          'flex h-full w-[calc((100%-var(--spacing)*72)*2/3)] flex-col overflow-hidden border-l border-border bg-background outline-hidden [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-swiping:select-none data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)]',
          className
        )}
        data-slot='drawer-content'
        {...props}
      >
        <DrawerPrimitive.Content className='flex min-h-0 flex-1 flex-col'>
          {children}
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Popup>
    </DrawerPrimitive.Viewport>
  </DrawerPrimitive.Portal>
);

export { Drawer, DrawerClose, DrawerContent, DrawerTrigger };
