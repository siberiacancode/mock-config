import type { GraphQLRequestConfig } from 'mock-config-server';

export const getUserQuery: GraphQLRequestConfig = {
  operationName: 'getUser',
  operationType: 'query',
  routes: [
    {
      data: { id: 1, emoji: '🎉' }
    },
    {
      data: { id: 2, emoji: '🔥' },
      entities: {
        variables: {
          id: 2
        }
      }
    }
  ]
};

export const createUserMutation: GraphQLRequestConfig = {
  operationName: 'createUser',
  operationType: 'mutation',
  routes: [
    {
      data: { id: 1, emoji: '🎉' }
    },
    {
      data: { id: 2, emoji: '🔥' },
      entities: {
        variables: {
          emoji: '🔥'
        }
      }
    }
  ]
};
