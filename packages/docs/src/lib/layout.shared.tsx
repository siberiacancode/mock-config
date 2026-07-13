import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { LogoIcon } from '@/components/icons';

export const baseOptions = (): BaseLayoutProps => ({
  nav: {
    title: (
      <>
        <LogoIcon />
        <span className='text-xl'>mock-config</span>
      </>
    )
  },
  links: []
});
