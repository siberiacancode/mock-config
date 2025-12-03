import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

type LayoutDocsProps = LayoutProps<'/docs'>;

const Layout = ({ children }: LayoutDocsProps) => (
  <DocsLayout tree={source.pageTree} {...baseOptions()}>
    {children}
  </DocsLayout>
);

export default Layout;
