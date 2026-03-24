import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        method: 'get',
        path: '/users',
        routes: [
          {
            data: [{ id: 1, emoji: '🎉' }]
          }
        ],
        interceptors: {
          request: (params) => {
            console.log(params.getHeaders());
          }
        }
      }
    ]
  }
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
