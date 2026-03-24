import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mockServerConfig: MockServerConfig = [
  {
    staticPath: {
      path: '/images',
      prefix: '/files'
    }
  }
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
