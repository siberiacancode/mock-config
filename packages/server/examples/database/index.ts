import type { MockServerConfig } from 'mock-config-server';

import { createMockServer, startMockServer } from 'mock-config-server';

export const mapockServerConfig: MockServerConfig = [
  {
    baseUrl: '/api',
    database: {
      // data: './database.json'
      data: {
        users: [{ id: 1, emoji: '🎉' }]
      },
      routes: {
        '/*/users/:id': '/api/users/:id'
      }
    }
  }
];

createMockServer(mapockServerConfig);
startMockServer(mapockServerConfig);
