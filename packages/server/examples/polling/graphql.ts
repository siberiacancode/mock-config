import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        operationType: 'query',
        operationName: 'GetUsers',
        routes: [
          {
            settings: {
              polling: true
            },
            queue: [
              { data: [{ id: 1, emoji: '🎉' }] },
              { time: 1000, data: [{ id: 2, emoji: '🔥' }] }
            ]
          }
        ]
      }
    ]
  }
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
