import { mock, rest } from 'mock-config-server';

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
      rest.get('/users', () => users),
      rest.get('/users/:id', (params) => {
        const user = users[Number(params.request.params.id) - 1];
        if (!user) {
          params.setStatusCode(404);
          return { error: 'Not found' };
        }
        return user;
      }),
      rest.post('/users', (params) => {
        const user = params.request.body;
        users.push(user);
        return user;
      }),
      rest.put('/users/:id', (params) => {
        const user = params.request.body;
        users[Number(params.request.params.id) - 1] = user;
        return user;
      }),
      rest.delete('/users/:id', (params) => {
        users.splice(Number(params.request.params.id) - 1, 1);
        return { ok: true };
      })
    ]
  }
);
