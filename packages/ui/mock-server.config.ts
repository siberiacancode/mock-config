import type { MockServerConfig, WsParams } from 'mock-config-server';

import { startsWith } from 'mock-config-server';

const USERS = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'admin',
    createdAt: '2025-01-15T09:30:00.000Z'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'user',
    createdAt: '2025-03-02T14:05:00.000Z'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'user',
    createdAt: '2025-06-21T18:45:00.000Z'
  }
];

const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkpvaG4gRG9lIn0.mock-signature';

const mockServerConfig: MockServerConfig = [
  {
    baseUrl: '/',
    port: 31299
  },
  {
    name: 'auth',
    configs: [
      {
        method: 'post',
        path: '/auth/login',
        routes: [
          {
            data: { message: 'Invalid credentials' },
            settings: { status: 401 }
          },
          {
            data: { accessToken: ACCESS_TOKEN, refreshToken: 'mock-refresh-token', user: USERS[0] },
            entities: {
              body: { email: 'john.doe@example.com', password: 'qwerty123' }
            }
          }
        ]
      },
      {
        method: 'get',
        path: '/auth/me',
        routes: [
          {
            data: { message: 'Unauthorized' },
            settings: { status: 401 }
          },
          {
            data: USERS[0],
            entities: {
              headers: {
                authorization: startsWith('Bearer ')
              }
            }
          }
        ]
      },
      {
        method: 'post',
        path: '/auth/logout',
        routes: [{ data: null, settings: { status: 204 } }]
      }
    ]
  },
  {
    name: 'users',
    configs: [
      {
        method: 'get',
        path: '/users',
        routes: [
          {
            data: { items: USERS, page: 1, limit: 10, total: USERS.length }
          },
          {
            data: { items: [USERS[2]], page: 2, limit: 2, total: USERS.length },
            entities: {
              queries: { page: '2', limit: '2' }
            }
          }
        ]
      },
      {
        method: 'get',
        path: '/users/:id',
        routes: [
          {
            data: { message: 'User not found' },
            settings: { status: 404 }
          },
          {
            data: USERS[0],
            entities: { params: { id: '1' } }
          }
        ]
      },
      {
        method: 'post',
        path: '/users',
        routes: [
          {
            data: { id: 4, name: 'New User', email: 'new.user@example.com', role: 'user' },
            settings: { status: 201 }
          }
        ]
      },
      {
        method: 'delete',
        path: '/users/:id',
        routes: [{ data: null, settings: { status: 204 } }]
      }
    ]
  },
  {
    name: 'graphql',
    configs: [
      {
        operationType: 'query',
        identifier: 'GetUser',
        routes: [
          {
            data: { data: { user: null } }
          },
          {
            data: { data: { user: { id: '1', name: 'John Doe', email: 'john.doe@example.com' } } },
            entities: {
              variables: { id: '1' }
            }
          }
        ]
      },
      {
        operationType: 'mutation',
        identifier: 'CreateUser',
        routes: [
          {
            data: { data: { createUser: { id: '4', name: 'New User' } } }
          }
        ]
      }
    ]
  },
  {
    name: 'websockets',
    configs: [
      {
        operationType: 'subscription',
        identifier: 'OnUserCreated',
        routes: [
          {
            data: { data: { onUserCreated: { id: '4', name: 'New User' } } }
          }
        ]
      },
      {
        type: 'connection',
        routes: [
          {
            data: () => ({ type: 'welcome', message: 'connected to mock ws' })
          }
        ]
      },
      {
        type: 'raw',
        routes: [
          {
            data: (params: WsParams) => ({ type: 'echo', payload: String(params.raw) })
          }
        ]
      }
    ]
  }
];

export default mockServerConfig;
