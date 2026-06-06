import { describe, expect, it } from 'vitest';

import { getGraphqlTransportWsInput } from './getGraphqlTransportWsInput';

describe('getGraphqlTransportWsInput', () => {
  it('Should get correct graphQL subscription input from message', () => {
    expect(
      getGraphqlTransportWsInput(`
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
      getGraphqlTransportWsInput(`
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

  it('Should parse complete message', () => {
    expect(
      getGraphqlTransportWsInput(`
        {
          "id": "1",
          "type": "complete"
        }
      `)
    ).toStrictEqual({
      id: '1',
      type: 'complete'
    });
  });

  it('Should parse next and error messages', () => {
    expect(
      getGraphqlTransportWsInput(`
        {
          "id": "1",
          "type": "next",
          "payload": { "data": { "ok": true } }
        }
      `)
    ).toStrictEqual({
      id: '1',
      type: 'next',
      payload: { data: { ok: true } }
    });

    expect(
      getGraphqlTransportWsInput(`
        {
          "id": "1",
          "type": "error",
          "payload": [
            { "message": "fail" }
          ]
        }
      `)
    ).toStrictEqual({
      id: '1',
      type: 'error',
      payload: [{ message: 'fail' }]
    });
  });
});
