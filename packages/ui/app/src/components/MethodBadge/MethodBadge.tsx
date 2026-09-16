import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export type Method =
  | 'delete'
  | 'get'
  | 'mutation'
  | 'options'
  | 'patch'
  | 'post'
  | 'put'
  | 'query'
  | 'subscription'
  | 'ws';

const METHOD_LABELS: Partial<Record<Method, string>> = {
  mutation: 'MUT',
  subscription: 'SUB'
};

type MethodBadgeVariant = 'active' | 'default';

const VARIANT_CLASSES: Record<MethodBadgeVariant, string> = {
  default:
    'border-border bg-background-secondary text-foreground-secondary group-data-active:border-accent group-data-active:bg-accent group-data-active:text-accent-foreground',
  active: 'border-accent bg-accent text-accent-foreground'
};

interface MethodBadgeProps extends ComponentProps<'span'> {
  method: Method;
  variant?: MethodBadgeVariant;
}

export const MethodBadge = ({
  method,
  variant = 'default',
  className,
  ...props
}: MethodBadgeProps) => (
  <span
    className={cn(
      'inline-block min-w-11 rounded-sm border px-1.5 py-0.5 text-center font-code text-[11px] font-semibold tracking-wide',
      VARIANT_CLASSES[variant],
      className
    )}
    {...props}
  >
    {METHOD_LABELS[method] ?? method.toUpperCase()}
  </span>
);
