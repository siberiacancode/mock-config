import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { Logo } from '@/components/icons';

export const baseOptions = (): BaseLayoutProps => ({
  githubUrl: 'https://github.com/siberiacancode/mock-config',
  nav: {
    title: (
      <>
        <Logo alt='Mock Config logo' className='size-[23px] shrink-0' />
        <span className='text-lg'>Mock config</span>
      </>
    )
  },
  links: []
});
