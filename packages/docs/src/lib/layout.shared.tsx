import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { LogoIcon } from '@/components/icons';

export const baseOptions = (): BaseLayoutProps => ({
  githubUrl: 'https://github.com/siberiacancode/mock-config',
  nav: {
    title: (
      <>
        <LogoIcon />
        <span className='text-lg'>Mock config</span>
      </>
    )
  },
  links: []
});
