import type { FlatMockServerConfig } from 'mock-config-server';

import { createFlatMockServer, startFlatMockServer } from 'mock-config-server';

export const mockServerConfig: FlatMockServerConfig = [
  {
    staticPath: '/images'
  }
];

createFlatMockServer(mockServerConfig);
startFlatMockServer(mockServerConfig);
