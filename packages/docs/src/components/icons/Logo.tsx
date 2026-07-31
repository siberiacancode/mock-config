import type { ComponentProps } from 'react';

import { cn } from '@siberiacancode/reactuse';

export type LogoProps = ComponentProps<'img'>;

export const Logo = ({ className = '', ...props }: LogoProps) => (
  <>
    <img
      className={cn('hidden object-contain dark:block', className)}
      src='/mock-config/logo/logo-dark.svg'
      {...props}
    />
    <img
      className={cn('object-contain dark:hidden', className)}
      src='/mock-config/logo/logo-light.svg'
      {...props}
    />
  </>
);
