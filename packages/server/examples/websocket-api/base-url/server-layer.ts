import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mockServerConfig: MockServerConfig = [
  {
    baseUrl: '/ws'
  },
  {
    configs: [
      {
        event: 'get-users',
        routes: [
          {
            event: [{ id: 1, emoji: '🎉' }]
          }
        ]
      }
    ]
  }
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
