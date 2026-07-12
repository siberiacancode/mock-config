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

const METHOD_COLORS: Record<Method, string> = {
  get: 'text-tag-4 bg-tag-4/15',
  post: 'text-tag-2 bg-tag-2/15',
  put: 'text-tag-3 bg-tag-3/15',
  patch: 'text-tag-3 bg-tag-3/15',
  delete: 'text-tag-1 bg-tag-1/15',
  options: 'text-tag-5 bg-tag-5/15',
  query: 'text-tag-5 bg-tag-5/15',
  mutation: 'text-tag-5 bg-tag-5/15',
  subscription: 'text-tag-5 bg-tag-5/15',
  ws: 'text-accent bg-accent/15'
};

const METHOD_LABELS: Partial<Record<Method, string>> = {
  mutation: 'MUT',
  subscription: 'SUB'
};

interface MethodBadgeProps extends ComponentProps<'span'> {
  method: Method;
}

export const MethodBadge = ({ method, className, ...props }: MethodBadgeProps) => (
  <span
    className={cn(
      'inline-block min-w-11 rounded-sm px-1.5 py-0.5 text-center font-code text-[11px] font-semibold tracking-wide',
      METHOD_COLORS[method],
      className
    )}
    {...props}
  >
    {METHOD_LABELS[method] ?? method.toUpperCase()}
  </span>
);
