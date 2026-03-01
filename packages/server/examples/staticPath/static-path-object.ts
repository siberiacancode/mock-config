import type { FlatMockServerConfig } from 'mock-config-server';

import { createFlatMockServer, startFlatMockServer } from 'mock-config-server';

export const mockServerConfig: FlatMockServerConfig = [
  {
    staticPath: {
      path: '/images',
      prefix: '/files'
    }
  }
];

createFlatMockServer(mockServerConfig);
startFlatMockServer(mockServerConfig);
