import { describe, expect, it, vi } from 'vitest';

import { graphql } from './graphql';

describe('graphql', () => {
  it('Should build config for inline response', () => {
    const result = graphql.query('GetUsers', { ok: true }, { delay: 25, status: 201 });

    expect(result).toStrictEqual({
      operationName: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: { ok: true },
          entities: {},
          settings: { delay: 25, status: 201 }
        }
      ]
    });
  });

  it('Should build config for response object with match', () => {
    const result = graphql.query(
      'GetUsers',
      {
        match: {
          headers: {
            key: 'value'
          }
        },
        response: { ok: true }
      },
      { delay: 20, status: 205 }
    );

    expect(result).toStrictEqual({
      operationName: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: { ok: true },
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: { delay: 20, status: 205 }
        }
      ]
    });
  });

  it('Should use empty entities for response object without match', () => {
    const result = graphql.query('GetUsers', { response: { ok: true } });

    expect(result).toStrictEqual({
      operationName: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: { ok: true },
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build config for inline handler', () => {
    const handler = vi.fn().mockResolvedValue({ ok: true });
    const result = graphql.query('GetUsers', handler, { delay: 30 });

    expect(result).toStrictEqual({
      operationName: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: handler,
          entities: {},
          settings: { delay: 30 }
        }
      ]
    });
  });

  it('Should build config for handler object with match', () => {
    const handler = vi.fn().mockResolvedValue({ ok: true });
    const result = graphql.query(
      'GetUsers',
      {
        handler,
        match: {
          headers: {
            key: 'value'
          }
        }
      },
      { delay: 40, status: 206 }
    );

    expect(result).toStrictEqual({
      operationName: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: handler,
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: { delay: 40, status: 206 }
        }
      ]
    });
  });

  it('Should build config for queue object as data handler', () => {
    const queueHandler = vi.fn().mockResolvedValue({ ok: 'handler' });
    const result = graphql.query(
      'GetUsers',
      {
        match: {
          headers: {
            key: 'value'
          }
        },
        queue: [
          { handler: queueHandler, time: 100 },
          { response: { ok: 'response' }, time: 200 }
        ]
      },
      { delay: 50, status: 207 }
    );

    expect(result).toStrictEqual({
      operationName: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: expect.any(Function),
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: { delay: 50, status: 207 }
        }
      ]
    });
  });

  it('Should build mutation config with operationName and mode type', () => {
    const result = graphql.mutation('CreateUser', { ok: true });

    expect(result).toStrictEqual({
      operationName: 'CreateUser',
      operationType: 'mutation',
      routes: [
        {
          data: { ok: true },
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build raw config with default operation type', () => {
    const result = graphql.raw('query { users { id } }', { ok: true });

    expect(result).toStrictEqual({
      query: 'query { users { id } }',
      operationType: 'query',
      routes: [
        {
          data: { ok: true },
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build raw config with explicit operation type', () => {
    const result = graphql.raw(
      'mutation { createUser { id } }',
      { ok: true },
      undefined,
      'mutation'
    );

    expect(result).toStrictEqual({
      query: 'mutation { createUser { id } }',
      operationType: 'mutation',
      routes: [
        {
          data: { ok: true },
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should keep provided settings for request', () => {
    const result = graphql.query(
      'GetUsers',
      { response: { ok: true } },
      { delay: 150, status: 200 }
    );

    expect(result).toStrictEqual({
      operationName: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: { ok: true },
          entities: {},
          settings: { delay: 150, status: 200 }
        }
      ]
    });
  });

  it('Should build subscription config for inline response only', () => {
    const result = graphql.subscription('OnUsers', { key: 'value' });

    expect(result).toStrictEqual({
      operationName: 'OnUsers',
      operationType: 'subscription',
      routes: [
        {
          data: { key: 'value' },
          entities: {}
        }
      ]
    });
  });

  it('Should build subscription config for handler function only', () => {
    const result = graphql.subscription('OnUsers', () => ({ ok: true }));

    expect(result).toStrictEqual({
      operationName: 'OnUsers',
      operationType: 'subscription',
      routes: [
        {
          data: expect.any(Function),
          entities: {}
        }
      ]
    });
  });

  it('Should build subscription config for response object with match (e.g. variables)', () => {
    const result = graphql.subscription('OnUsers', {
      match: {
        variables: { key: 'value' }
      },
      response: { key: 'value' }
    });

    expect(result).toStrictEqual({
      operationName: 'OnUsers',
      operationType: 'subscription',
      routes: [
        {
          data: { key: 'value' },
          entities: {
            variables: { key: 'value' }
          }
        }
      ]
    });
  });

  it('Should build subscription config for handler object with match', () => {
    const result = graphql.subscription('OnUsers', {
      handler: () => ({ count: 1 }),
      match: {
        variables: { key: 'value' }
      }
    });

    expect(result).toStrictEqual({
      operationName: 'OnUsers',
      operationType: 'subscription',
      routes: [
        {
          data: expect.any(Function),
          entities: {
            variables: { key: 'value' }
          }
        }
      ]
    });
  });

  it('Should type handler params with all typed fields', () => {
    const result = graphql.query<{
      query: { query: string };
      body: { body: string };
      params: { params: string };
      response: { response: string };
    }>('GetUsers', (params) => {
      const query = params.request.query.query;
      const body = params.request.body.body;
      const path = params.request.params.params;
      console.log(query, body, path);

      return { response: 'value' };
    });

    expect(result).toStrictEqual({
      operationName: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: expect.any(Function),
          entities: {},
          settings: {}
        }
      ]
    });
  });
});
