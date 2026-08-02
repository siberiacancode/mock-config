import type { Response as ExpressResponse } from 'express';

import { describe, expectTypeOf, it } from 'vitest';

import { graphql } from './graphql';

describe('graphql types', () => {
  it('Should type handler params with all typed fields', () => {
    graphql.query<{
      query: { query: string };
      body: { body: string };
      params: { params: string };
      response: { data: { response: string } };
    }>('GetUsers', ({ request }) => {
      expectTypeOf(request.query).toEqualTypeOf<{ query: string }>();
      expectTypeOf(request.body).toEqualTypeOf<{ body: string }>();
      expectTypeOf(request.params).toEqualTypeOf<{ params: string }>();
      expectTypeOf(request.res).toEqualTypeOf<
        ExpressResponse<{ data: { response: string } }> | undefined
      >();

      return { data: { response: 'value' } };
    });
  });

  it('Should type inline responses and handlers with reserved config fields', () => {
    interface PollingResponse {
      data: { response: 'ordinary response data' };
      polling: [{ response: { data: { response: 'polling config-like data' } } }];
    }

    graphql.query<{ response: PollingResponse }>('GetUsers', {
      data: { response: 'ordinary response data' },
      polling: [{ response: { data: { response: 'polling config-like data' } } }]
    });

    graphql.query<{ response: PollingResponse }>('GetUsers', () => ({
      data: { response: 'ordinary response data' },
      polling: [{ response: { data: { response: 'polling config-like data' } } }]
    }));
  });
});
