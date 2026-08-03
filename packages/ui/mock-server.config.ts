import type { ResponseInterceptorParams } from 'mock-config-server';

import { equals, graphql, mock, oneOf, regExp, rest, startsWith, ws } from 'mock-config-server';

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

interface User {
  id: number;
  name: string;
  posts?: Post[];
}
interface Post {
  author: User;
  id: number;
}

const john: User = { id: 1, name: 'John' };
const post: Post = { id: 10, author: john };
john.posts = [post];

export default mock(
  {
    baseUrl: '/',
    port: 31299
  },
  {
    name: 'auth',
    configs: [
      rest.post('/auth/login', { message: 'Invalid credentials' }, { status: 401 }),
      rest.post('/auth/login', {
        response: {
          accessToken: ACCESS_TOKEN,
          refreshToken: 'mock-refresh-token',
          user: USERS[0]
        },
        match: {
          body: { email: 'john.doe@example.com', password: 'qwerty123' }
        }
      }),

      rest.get('/auth/me', { message: 'Unauthorized' }, { status: 401 }),
      rest.get('/auth/me', {
        response: USERS[0],
        match: {
          cookies: { session: 'mock-session' }
        }
      }),

      rest.get('/auth/session', { message: 'Unauthorized' }, { status: 401 }),
      rest.get('/auth/session', {
        response: USERS[0],
        match: {
          headers: { authorization: startsWith('Bearer') }
        }
      }),

      rest.post('/auth/logout', null, { status: 204 })
    ]
  },
  {
    name: 'users',
    interceptors: {
      response: (data: unknown, params: ResponseInterceptorParams) => {
        params.setHeader('x-total-count', String(USERS.length));
        return data;
      }
    },
    configs: [
      rest.get('/users', { items: USERS, page: 1, limit: 10, total: USERS.length }),
      rest.get('/users', {
        response: { items: [USERS[2]], page: 2, limit: 2, total: USERS.length },
        match: {
          queries: { page: '2', limit: '2' }
        }
      }),

      rest.get('/users/search', { items: [], total: 0 }),
      rest.get('/users/search', {
        response: { items: [USERS[0]], total: 1 },
        match: {
          queries: {
            role: oneOf(equals('admin'), equals('user')),
            name: regExp(/^[A-Z][a-z]+$/)
          }
        }
      }),

      // the mock server cannot serve this one, sending it is expected to fail with a 500
      rest.get('/users/graph', john),

      rest.get('/users/:id', { message: 'User not found' }, { status: 404 }),
      rest.get('/users/:id', {
        response: USERS[0],
        match: {
          params: { id: '1' }
        }
      }),

      rest.post(
        '/users',
        { id: 4, name: 'New User', email: 'new.user@example.com', role: 'user' },
        { status: 201 }
      ),

      rest.delete('/users/:id', null, { status: 204 })
    ]
  },
  {
    name: 'graphql',
    configs: [
      graphql.query('GetUser', { data: { user: null } }),
      graphql.query('GetUser', {
        response: {
          data: { user: { id: '1', name: 'John Doe', email: 'john.doe@example.com' } }
        },
        match: {
          variables: { id: '1' }
        }
      }),

      graphql.mutation('CreateUser', { data: { createUser: { id: '4', name: 'New User' } } })
    ]
  },
  {
    name: 'websockets',
    baseUrl: '/ws/users',
    configs: [
      graphql.subscription('OnUserCreated', {
        data: { onUserCreated: { id: '4', name: 'New User' } }
      }),

      ws.connection(() => ({ type: 'welcome', message: 'connected to mock ws' })),
      ws.message((params) => ({ type: 'echo', payload: String(params.raw) }))
    ]
  }
);
