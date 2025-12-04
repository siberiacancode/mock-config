import type { NextConfig } from 'next';

import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/mock-config',
  serverExternalPackages: ['typescript', 'twoslash']
};

export default withMDX(config);
