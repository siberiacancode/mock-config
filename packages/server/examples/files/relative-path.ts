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
            // Will looking for file by (process.cwd() + "/relative/path/to/file") path
            file: './relative/path/to/file'
          }
        ]
      }
    ]
  }
];

createMockServer(mockServerConfig);
startMockServer(mockServerConfig);
