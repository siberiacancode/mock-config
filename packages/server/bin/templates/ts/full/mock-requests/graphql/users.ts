import type { GraphQLRequestConfig } from 'mock-config-server';

export const getUsersQuery: GraphQLRequestConfig = {
  operationName: 'getUsers',
  operationType: 'query',
  routes: [
    {
      data: [
        { id: 1, emoji: '🎉' },
        { id: 2, emoji: '🔥' }
      ]
    }
  ]
};
