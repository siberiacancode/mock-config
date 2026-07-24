import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const getStatusColor = (status: number) => {
  if (status < 300) return 'bg-additional-success/15 text-additional-success';
  if (status < 400) return 'bg-additional-warning/15 text-additional-warning';
  return 'bg-additional-fail/15 text-additional-fail';
};

interface StatusBadgeProps extends ComponentProps<'span'> {
  status: number;
}

export const StatusBadge = ({ status, className, children, ...props }: StatusBadgeProps) => (
  <span
    className={cn(
      'rounded-md px-2 py-0.5 font-code text-[11px]',
      getStatusColor(status),
      className
    )}
    {...props}
  >
    {children ?? status}
  </span>
);
