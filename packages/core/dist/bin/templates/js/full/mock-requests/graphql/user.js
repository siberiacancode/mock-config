export const getUserQuery = {
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

export const createUserMutation = {
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
