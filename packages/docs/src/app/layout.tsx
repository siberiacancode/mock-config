import { RootProvider } from 'fumadocs-ui/provider/next';
import { Mulish } from 'next/font/google';

import './global.css';

const mulish = Mulish({
  weight: ['400', '500', '700'],
  subsets: ['latin']
});

type AppLayoutProps = LayoutProps<'/'>;

const Layout = ({ children }: AppLayoutProps) => (
  <html className={mulish.className} lang='en' suppressHydrationWarning>
    <body className='flex flex-col min-h-screen'>
      <RootProvider>{children}</RootProvider>
    </body>
  </html>
);

export default Layout;
