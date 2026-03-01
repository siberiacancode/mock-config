import type { FlatMockServerConfig } from 'mock-config-server';

import { createFlatMockServer, startFlatMockServer } from 'mock-config-server';

export const mockServerConfig: FlatMockServerConfig = [
  {
    cors: {
      // origin: () => new Promise((res) => 'https://www.google.com')
      // origin: () => 'https://www.google.com'
      // origin: ['https://www.google.com']
      origin: 'https://www.google.com',
      methods: ['GET'],
      allowedHeaders: ['accept'],
      exposedHeaders: ['accept'],
      maxAge: 3600,
      credentials: true
    }
  },
  {
    configs: [
      {
        method: 'get',
        path: '/users',
        routes: [
          {
            data: [{ id: 1, emoji: '🎉' }]
          }
        ]
      },
      {
        method: 'delete',
        path: '/users/:id',
        routes: [
          {
            data: { succes: true }
          }
        ]
      }
    ]
  },
  {
    configs: [
      {
        operationType: 'query',
        operationName: 'GetUsers',
        routes: [
          {
            data: [{ id: 1, emoji: '🎉' }]
          }
        ]
      },
      {
        operationType: 'mutation',
        operationName: 'CreateUser',
        routes: [
          {
            data: { id: 1, emoji: '🎉' }
          }
        ]
      }
    ]
  }
];

createFlatMockServer(mockServerConfig);
startFlatMockServer(mockServerConfig);
