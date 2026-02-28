export const getUserRequest = {
  method: 'get',
  path: '/users/:id',
  routes: [
    {
      data: { id: 1, emoji: '🎉' }
    },
    {
      data: { id: 2, emoji: '🔥' },
      entities: {
        params: {
          id: 2
        }
      }
    }
  ]
};

export const postUserRequest = {
  method: 'post',
  path: '/users',
  routes: [
    {
      data: { id: 1, emoji: '🎉' }
    },
    {
      data: { id: 2, emoji: '🔥' },
      entities: {
        body: {
          emoji: '🔥'
        }
      }
    }
  ]
};
