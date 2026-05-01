import { describe, expect, it } from 'vitest';

import { getGraphQLWsProtocolInput } from './getGraphQLWsProtocolInput';

describe('getGraphQLWsProtocolInput', () => {
  it('Should get correct graphQL subscription input from message', () => {
    expect(
      getGraphQLWsProtocolInput(`
        {
          "id": "1",
          "type": "subscribe",
          "payload": {
            "query": "subscription users { id }",
            "operationName": "Users",
            "variables": { "roomId": "1" }
          }
        }
      `)
    ).toStrictEqual({
      id: '1',
      payload: {
        query: 'subscription users { id }',
        operationName: 'Users',
        variables: { roomId: '1' }
      },
      type: 'subscribe'
    });
  });

  it('Should omit variables when not a plain object', () => {
    expect(
      getGraphQLWsProtocolInput(`
        {
          "id": "1",
          "type": "subscribe",
          "payload": {
            "query": "subscription users { id }",
            "operationName": "Users",
            "variables": "primitive"
          }
        }
      `)
    ).toStrictEqual({
      id: '1',
      payload: {
        query: 'subscription users { id }',
        operationName: 'Users',
        variables: undefined
      },
      type: 'subscribe'
    });
  });
});
