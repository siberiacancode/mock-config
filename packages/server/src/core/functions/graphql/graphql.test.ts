import { describe, expect, it, vi } from 'vitest';

import { graphql } from './graphql';

describe('graphql', () => {
  it('Should build config for inline response', () => {
    const result = graphql.query('GetUsers', { data: { ok: true } }, { delay: 25, status: 201 });

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: { data: { ok: true } },
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
        response: { data: { ok: true } }
      },
      { delay: 20, status: 205 }
    );

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: { data: { ok: true } },
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
    const result = graphql.query('GetUsers', { response: { data: { ok: true } } });

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: { data: { ok: true } },
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build config for inline handler', () => {
    const handler = vi.fn().mockResolvedValue({ data: { ok: true } });
    const result = graphql.query('GetUsers', handler, { delay: 30 });

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
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
    const handler = vi.fn().mockResolvedValue({ data: { ok: true } });
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
      identifier: 'GetUsers',
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

  it('Should build config for polling object as data handler', () => {
    const pollingHandler = vi.fn().mockResolvedValue({ data: { ok: 'handler' } });
    const result = graphql.query(
      'GetUsers',
      {
        match: {
          headers: {
            key: 'value'
          }
        },
        polling: [
          { handler: pollingHandler, time: 100 },
          { response: { data: { ok: 'response' } }, time: 200 }
        ]
      },
      { delay: 50, status: 207 }
    );

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
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

  it('Should build config for generator polling object as data handler', () => {
    const result = graphql.query('GetUsers', {
      match: {
        headers: {
          key: 'value'
        }
      },
      *polling() {
        yield { data: { count: 1 } };
        return { data: { count: 2 } };
      }
    });

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: expect.any(Function),
          entities: {
            headers: {
              key: 'value'
            }
          },
          settings: {}
        }
      ]
    });
  });

  it('Should type generator polling params with full graphql resolver context', () => {
    const result = graphql.query<{
      query: { query: string };
      body: { body: string };
      params: { params: string };
      response: { data: { response: string } };
    }>('GetUsers', {
      *polling(params) {
        const query = params.request.query.query;
        const body = params.request.body.body;
        const path = params.request.params.params;
        params.setStatusCode(200);
        console.log(query, body, path);

        yield { data: { response: 'value' } };
      }
    });

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
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

  it('Should build mutation config with operationName and mode type', () => {
    const result = graphql.mutation('CreateUser', { data: { ok: true } });

    expect(result).toStrictEqual({
      identifier: 'CreateUser',
      operationType: 'mutation',
      routes: [
        {
          data: { data: { ok: true } },
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should keep provided settings for request', () => {
    const result = graphql.query(
      'GetUsers',
      { response: { data: { ok: true } } },
      { delay: 150, status: 200 }
    );

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: { data: { ok: true } },
          entities: {},
          settings: { delay: 150, status: 200 }
        }
      ]
    });
  });

  it('Should build subscription config for inline response only', () => {
    const result = graphql.subscription('OnUsers', { data: { key: 'value' } });

    expect(result).toStrictEqual({
      identifier: 'OnUsers',
      operationType: 'subscription',
      routes: [
        {
          data: { data: { key: 'value' } },
          entities: {}
        }
      ]
    });
  });

  it('Should build subscription config for handler function only', () => {
    const result = graphql.subscription('OnUsers', () => ({ data: { ok: true } }));

    expect(result).toStrictEqual({
      identifier: 'OnUsers',
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
      response: { data: { key: 'value' } }
    });

    expect(result).toStrictEqual({
      identifier: 'OnUsers',
      operationType: 'subscription',
      routes: [
        {
          data: { data: { key: 'value' } },
          entities: {
            variables: { key: 'value' }
          }
        }
      ]
    });
  });

  it('Should build subscription config for handler object with match', () => {
    const result = graphql.subscription('OnUsers', {
      handler: () => ({ data: { count: 1 } }),
      match: {
        variables: { key: 'value' }
      }
    });

    expect(result).toStrictEqual({
      identifier: 'OnUsers',
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
      response: { data: { response: string } };
    }>('GetUsers', (params) => {
      const query = params.request.query.query;
      const body = params.request.body.body;
      const path = params.request.params.params;
      console.log(query, body, path);

      return { data: { response: 'value' } };
    });

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
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
