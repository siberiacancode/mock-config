import { graphql, mock } from 'mock-config-server';

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
    name: 'graphql',
    baseUrl: '/graphql',
    configs: [
      graphql.query('GetUsers', () => users),
      graphql.query<{ body: { variables: { id: string } } }>('GetUser', (params) => {
        const id = params.request.body.variables.id;
        const user = users[Number(id) - 1];
        if (!user) {
          params.setStatusCode(404);
          return { error: 'Not found' };
        }
        return user;
      }),
      graphql.mutation<{ body: { variables: { emoji: string; name: string } } }>(
        'CreateUser',
        (params) => {
          const user = params.request.body.variables;
          users.push(user);
          return user;
        }
      ),
      graphql.mutation<{ body: { variables: { id: string; emoji: string; name: string } } }>(
        'ChangeUser',
        (params) => {
          const user = params.request.body.variables;
          users[Number(user.id) - 1] = user;
          return user;
        }
      ),
      graphql.mutation<{ body: { variables: { id: string } } }>('DeleteUser', (params) => {
        users.splice(Number(params.request.body.variables.id) - 1, 1);
        return { ok: true };
      })
    ]
  }
);
