import type { IncomingMessage } from 'node:http';

import { describe, expect, it } from 'vitest';

import { equals } from '../../../../entities';
import { isConnectionRequestMatchedByEntities } from './isConnectionRequestMatchedByEntities';

const createRequest = (value: object) =>
  ({
    headers: {},
    cookies: {},
    queries: {},
    ...value
  }) as unknown as IncomingMessage;

describe('isConnectionRequestMatchedByEntities', () => {
  it('Should match route configuration without entities', () => {
    expect(isConnectionRequestMatchedByEntities(createRequest({}), undefined)).toBe(true);
  });

  it('Should match by headers', () => {
    const request = createRequest({ headers: { key: 'value' } });

    expect(
      isConnectionRequestMatchedByEntities(request, {
        headers: { key: 'value' }
      })
    ).toBe(true);
    expect(
      isConnectionRequestMatchedByEntities(request, {
        headers: { key: 'other' }
      })
    ).toBe(false);
  });

  it('Should be case-insensitive for header keys', () => {
    const request = createRequest({ headers: { uppercase: 'value' } });

    expect(
      isConnectionRequestMatchedByEntities(request, {
        headers: { UPPERCASE: 'value' }
      })
    ).toBe(true);
  });

  it('Should match by cookies', () => {
    const request = createRequest({ cookies: { token: 'value' } });

    expect(
      isConnectionRequestMatchedByEntities(request, {
        cookies: { token: 'value' }
      })
    ).toBe(true);
    expect(
      isConnectionRequestMatchedByEntities(request, {
        cookies: { token: 'other' }
      })
    ).toBe(false);
  });

  it('Should match by queries', () => {
    const request = createRequest({ queries: { room: 'public' } });

    expect(
      isConnectionRequestMatchedByEntities(request, {
        queries: { room: 'public' }
      })
    ).toBe(true);
    expect(
      isConnectionRequestMatchedByEntities(request, {
        queries: { room: 'private' }
      })
    ).toBe(false);
  });

  it('Should match by comparator', () => {
    const request = createRequest({ queries: { room: 'public' } });

    expect(
      isConnectionRequestMatchedByEntities(request, {
        queries: { room: equals('public') }
      })
    ).toBe(true);
    expect(
      isConnectionRequestMatchedByEntities(request, {
        queries: equals({ room: 'public' })
      })
    ).toBe(true);
  });

  it('Should match only when every entity is matched', () => {
    const request = createRequest({
      headers: { key: 'value' },
      queries: { room: 'public' }
    });

    expect(
      isConnectionRequestMatchedByEntities(request, {
        headers: { key: 'value' },
        queries: { room: 'public' }
      })
    ).toBe(true);
    expect(
      isConnectionRequestMatchedByEntities(request, {
        headers: { key: 'value' },
        queries: { room: 'private' }
      })
    ).toBe(false);
  });
});
