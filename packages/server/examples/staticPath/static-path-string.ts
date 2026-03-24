import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mockServerConfig: MockServerConfig = [
  {
    staticPath: '/images'
  }
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
