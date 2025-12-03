import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { LogoIcon } from '@/components/icons';

export const baseOptions = (): BaseLayoutProps => ({
  nav: {
    title: (
      <>
        <LogoIcon />
        Mock config server
      </>
    )
  },
  links: []
});
