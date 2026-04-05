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
      graphql.query('GetUsers', users),
      graphql.query('GetUser', (params) => {
        const user = users[Number(params.request.params.id) - 1];
        if (!user) {
          params.setStatusCode(404);
          return { error: 'Not found' };
        }
        return user;
      })
    ]
  }
);
