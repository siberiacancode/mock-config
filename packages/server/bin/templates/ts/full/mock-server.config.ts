import { graphql, mock, rest, ws } from 'mock-config-server';

const users = [
  { emoji: '🍎', name: 'Alice' },
  { emoji: '🍌', name: 'Bob' },
  { emoji: '🍒', name: 'Carol' },
  { emoji: '🍇', name: 'Dan' },
  { emoji: '🥝', name: 'Eve' }
];

export default mock(
  { port: 7777, baseUrl: '/' },
  {
    name: 'rest',
    configs: [
      rest.get('/users', users),
      rest.get<{ params: { id: string } }>('/users/:id', (params) => {
        const user = users[Number(params.request.params.id) - 1];
        if (!user) {
          params.setStatusCode(404);
          return { error: 'Not found' };
        }
        return user;
      })
    ]
  },
  {
    name: 'graphql',
    baseUrl: '/graphql',
    configs: [
      graphql.query('GetUsers', { data: { users } }),
      graphql.query<{
        body: { variables: { id: string } };
        response: { data: { user: null | { emoji: string; name: string } } };
      }>('GetUser', (params) => {
        const user = users[Number(params.request.body.variables.id) - 1];
        if (!user) {
          params.setStatusCode(404);
          return { data: { user: null } };
        }
        return { data: { user } };
      })
    ]
  },
  {
    name: 'ws',
    baseUrl: '/ws',
    configs: [
      ws.connection(() => ({ message: `${new Date().toISOString()} Hello from server` })),
      ws.message(async (params) => {
        await params.setDelay(200);
        params.send({ ok: true });
      })
    ]
  }
);
