import type { VariantProps } from 'class-variance-authority';

import { cva } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/lib/utils';

const typographyVariants = cva('text-xl', {
  variants: {
    variant: {
      h1: 'font-sans text-xl font-medium',
      p: 'font-sans text-sm font-normal'
    },
    affects: {
      default: '',
      'body-medium': 'text-sm font-semibold',
      'body-regular': 'text-xs font-normal',
      'body-light': 'text-xs font-light',
      'code-regular': 'font-code font-normal text-xs',
      'code-light': 'font-code font-light text-[0.625rem]'
    }
  },
  defaultVariants: {
    variant: 'p',
    affects: 'default'
  }
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof typographyVariants> {
  ref?: React.Ref<HTMLHeadingElement>;
}

const Typography = ({ className, variant, affects, children, ...props }: TypographyProps) => {
  const Comp = variant || 'p';
  return (
    <Comp className={cn(typographyVariants({ variant, affects, className }))} {...props}>
      {children}
    </Comp>
  );
};

export { Typography, typographyVariants };
