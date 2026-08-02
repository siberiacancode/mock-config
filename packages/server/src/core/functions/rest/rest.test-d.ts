import type { Response as ExpressResponse } from 'express';

import { describe, expectTypeOf, it } from 'vitest';

import { rest } from './rest';

describe('rest types', () => {
  it('Should type handler params with all typed fields', () => {
    rest.post<{
      query: { query: string };
      body: { body: string };
      params: { params: string };
      response: { response: string };
    }>('/users/:id', ({ request }) => {
      expectTypeOf(request.query).toEqualTypeOf<{ query: string }>();
      expectTypeOf(request.body).toEqualTypeOf<{ body: string }>();
      expectTypeOf(request.params).toEqualTypeOf<{ params: string }>();
      expectTypeOf(request.res).toEqualTypeOf<ExpressResponse<{ response: string }> | undefined>();

      return { response: 'value' };
    });
  });

  it('Should type inline responses and handlers with reserved config fields', () => {
    interface FileResponse {
      file: '/tmp/user.json';
    }
    interface PollingResponse {
      polling: [{ response: 'ordinary response data' }];
    }

    rest.get<{ response: FileResponse }>('/users/file', { file: '/tmp/user.json' });
    rest.get<{ response: PollingResponse }>('/users/polling', {
      polling: [{ response: 'ordinary response data' }]
    });

    rest.get<{ response: FileResponse }>('/users/file-handler', () => ({
      file: '/tmp/user.json'
    }));
    rest.get<{ response: PollingResponse }>('/users/polling-handler', () => ({
      polling: [{ response: 'ordinary response data' }]
    }));
  });
});
