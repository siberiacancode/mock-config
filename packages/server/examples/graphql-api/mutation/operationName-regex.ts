import type { FlatMockServerConfig } from 'mock-config-server';

import { createFlatMockServer, startFlatMockServer } from 'mock-config-server';

export const mockServerConfig: FlatMockServerConfig = [
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

createFlatMockServer(mockServerConfig);
startFlatMockServer(mockServerConfig);
