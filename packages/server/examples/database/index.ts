import type { FlatMockServerConfig } from 'mock-config-server';

import { createFlatMockServer, startFlatMockServer } from 'mock-config-server';

export const mapockServerConfig: FlatMockServerConfig = [
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

createFlatMockServer(mapockServerConfig);
startFlatMockServer(mapockServerConfig);
