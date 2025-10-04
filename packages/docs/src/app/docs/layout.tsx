import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

const Layout = ({ children }: LayoutProps<'/docs'>) => (
  <DocsLayout tree={source.pageTree} {...baseOptions()}>
    {children}
  </DocsLayout>
);

export default Layout;
