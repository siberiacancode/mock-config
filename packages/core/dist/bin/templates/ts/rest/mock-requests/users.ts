import type { RestRequestConfig } from 'mock-config-server';

export const getUsersRequest: RestRequestConfig = {
  path: '/users',
  method: 'get',
  routes: [
    {
      data: [
        { id: 1, emoji: '🎉' },
        { id: 2, emoji: '🔥' }
      ]
    }
  ]
};
