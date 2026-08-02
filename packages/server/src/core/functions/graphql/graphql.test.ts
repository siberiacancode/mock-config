import { describe, expect, it, vi } from 'vitest';

import { graphql } from './graphql';

describe('graphql', () => {
  it('Should build config for response', () => {
    const result = graphql.query('GetUsers', { data: { ok: true } });

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

  it('Should treat an unbranded polling key as inline response data', () => {
    const response = {
      data: { ok: true },
      polling: [{ response: { data: { ok: 'ordinary response data' } } }]
    };
    const result = graphql.query('GetUsers', response);

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: response,
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build config for handler', () => {
    const handler = vi.fn().mockResolvedValue({ data: { ok: true } });
    const result = graphql.query('GetUsers', handler);

    expect(result).toStrictEqual({
      identifier: 'GetUsers',
      operationType: 'query',
      routes: [
        {
          data: handler,
          entities: {},
          settings: {}
        }
      ]
    });
  });

  it('Should build config for polling', () => {
    const pollingHandler = vi.fn().mockResolvedValue({ data: { ok: 'handler' } });
    const result = graphql.query(
      'GetUsers',
      graphql.polling([
        { handler: pollingHandler, time: 100 },
        { response: { data: { ok: 'response' } }, time: 200 }
      ])
    );

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

  it('Should build config for generator resolver', () => {
    const handler = function* () {
      yield { data: { count: 1 } };
      return { data: { count: 2 } };
    };
    const result = graphql.query('GetUsers', handler);

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

  it('Should preserve generator state between handler calls', () => {
    const result = graphql.query('GetUsers', function* () {
      yield { data: { count: 1 } };
      return { data: { count: 2 } };
    });

    const [route] = result.routes as [{ data: (params: any) => unknown }];
    const firstResponse = route.data({});
    const secondResponse = route.data({});
    const thirdResponse = route.data({});

    expect(firstResponse).toStrictEqual({ data: { count: 1 } });
    expect(secondResponse).toStrictEqual({ data: { count: 2 } });
    expect(thirdResponse).toStrictEqual({ data: { count: 1 } });
  });

  it('Should build request config for every graphql method', () => {
    const configs = [
      { method: 'query', result: graphql.query('GetUsers', { data: { ok: true } }) },
      { method: 'mutation', result: graphql.mutation('GetUsers', { data: { ok: true } }) },
      { method: 'subscription', result: graphql.subscription('GetUsers', { data: { ok: true } }) }
    ] as const;

    configs.forEach(({ method, result }) => {
      expect(result).toStrictEqual({
        identifier: 'GetUsers',
        operationType: method,
        routes: [
          {
            data: { data: { ok: true } },
            entities: {},
            settings: {}
          }
        ]
      });
    });
  });

  it('Should keep provided settings for request', () => {
    const result = graphql.query('GetUsers', { data: { ok: true } }, { delay: 150, status: 200 });

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

  it('Should use match from settings', () => {
    const result = graphql.query(
      'GetUsers',
      { data: { ok: true } },
      {
        delay: 150,
        match: {
          headers: {
            key: 'value'
          }
        },
        status: 200
      }
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
          settings: { delay: 150, status: 200 }
        }
      ]
    });
  });
});
