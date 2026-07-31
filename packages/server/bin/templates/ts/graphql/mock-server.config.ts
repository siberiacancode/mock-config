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
  }
);
