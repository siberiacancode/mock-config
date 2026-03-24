import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        method: 'delete',
        path: '/users?/:id',
        routes: [
          {
            data: { success: true }
          },
          {
            data: { success: false },
            entities: {
              params: {
                id: 2
              }
            }
          }
        ]
      },
      {
        method: 'delete',
        path: /\/users?\/\d+/,
        routes: [
          {
            data: { success: true }
          },
          {
            data: { success: false },
            entities: {
              params: {
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
