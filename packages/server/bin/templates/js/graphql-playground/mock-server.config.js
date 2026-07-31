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
      graphql.query('GetUsers', () => ({ data: { users } })),
      graphql.query('GetUser', (params) => {
        const id = params.request.body.variables.id;
        const user = users[Number(id) - 1];
        if (!user) {
          params.setStatusCode(404);
          return { data: { user: null } };
        }
        return { data: { user } };
      }),
      graphql.mutation('CreateUser', (params) => {
        const user = params.request.body.variables;
        users.push(user);
        return { data: { createUser: user } };
      }),
      graphql.mutation('ChangeUser', (params) => {
        const user = params.request.body.variables;
        users[Number(user.id) - 1] = user;
        return { data: { changeUser: user } };
      }),
      graphql.mutation('DeleteUser', (params) => {
        users.splice(Number(params.request.body.variables.id) - 1, 1);
        return { data: { deleteUser: true } };
      })
    ]
  }
);
