import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

import { getStatusColor } from './helpers';

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
