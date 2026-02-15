import { HomeLayout } from 'fumadocs-ui/layouts/home';

import { baseOptions } from '@/lib/layout.shared';

type HomeLayoutProps = LayoutProps<'/'>;

const Layout = ({ children }: HomeLayoutProps) => (
  <HomeLayout {...baseOptions()}>{children}</HomeLayout>
);

export default Layout;
