import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mockServerConfig: MockServerConfig = [
  {
    configs: [
      {
        path: '/file',
        method: 'get',
        routes: [
          {
            // Will looking for file by "~/absolute/path/to/file" path
            file: '~/absolute/path/to/file'
          }
        ]
      }
    ]
  }
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
