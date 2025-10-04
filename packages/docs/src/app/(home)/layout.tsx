import { HomeLayout } from 'fumadocs-ui/layouts/home';

import { baseOptions } from '@/lib/layout.shared';

const Layout = ({ children }: LayoutProps<'/'>) => (
  <HomeLayout {...baseOptions()}>{children}</HomeLayout>
);

export default Layout;
