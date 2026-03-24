import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        operationType: 'mutation',
        operationName: /Create(User|Account)/,
        routes: [
          {
            data: { id: 1, emoji: '🎉' }
          },
          {
            data: { id: 2, emoji: '🔥' },
            entities: {
              variables: {
                emoji: '🔥'
              }
            }
          }
        ]
      },
      {
        operationType: 'mutation',
        operationName: /Delete(User|Account)/,
        routes: [
          {
            data: { success: true }
          },
          {
            data: { success: false },
            entities: {
              variables: {
                id: 2
              }
            }
          }
        ]
      },
      {
        operationType: 'mutation',
        operationName: /Change(User|Account)/,
        routes: [
          {
            data: { id: 1, emoji: '🎉' }
          },
          {
            data: { id: 2, emoji: '🔥' },
            entities: {
              variables: {
                id: 2,
                emoji: '🔥'
              }
            }
          }
        ]
      }
    ]
  }
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
