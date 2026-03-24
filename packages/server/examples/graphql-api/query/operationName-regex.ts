import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        operationType: 'query',
        operationName: /Get(Users|Accounts)/,
        routes: [
          {
            data: [{ id: 1, emoji: '🎉' }]
          },
          {
            data: [{ id: 2, emoji: '🔥' }],
            entities: {
              query: {
                emoji: '🔥'
              }
            }
          }
        ]
      },
      {
        operationType: 'query',
        operationName: /Get(User|Account)/,
        routes: [
          {
            data: { id: 1, emoji: '🎉' }
          },
          {
            data: { id: 2, emoji: '🔥' },
            entities: {
              variables: {
                id: 2
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
