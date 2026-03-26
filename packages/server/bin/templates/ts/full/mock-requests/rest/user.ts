import type { RestRequestConfig } from 'mock-config-server';

export const getUserRequest: RestRequestConfig = {
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

export const postUserRequest: RestRequestConfig = {
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
