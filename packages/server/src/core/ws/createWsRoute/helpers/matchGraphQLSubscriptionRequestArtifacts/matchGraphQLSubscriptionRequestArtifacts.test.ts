import { describe, expect, it, vi } from 'vitest';

import type { GraphQLWsRequestArtifact } from '@/utils/types';

import { matchGraphQLSubscriptionRequestArtifacts } from './matchGraphQLSubscriptionRequestArtifacts';

const makeArtifact = (overrides: Partial<GraphQLWsRequestArtifact>) =>
  ({
    type: 'graphql-ws',
    baseUrl: '/',
    operationType: 'subscription',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as GraphQLWsRequestArtifact;

describe('matchGraphQLSubscriptionRequestArtifacts', () => {
  it('Should not match when path differs from baseUrl', () => {
    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifact: makeArtifact({ baseUrl: '/sub', operationName: 'Users' }),
      meta: {
        path: '/other',
        operationType: 'subscription',
        operationName: 'Users'
      }
    });
    expect(matched).toBe(false);
  });

  it('Should return empty when operationType is not subscription', () => {
    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifact: makeArtifact({ operationName: 'Users' }),
      meta: {
        path: '/',
        operationType: 'query',
        operationName: 'Users'
      }
    });
    expect(matched).toBe(false);
  });

  it('Should match equivalent queries with different insignificant whitespace', () => {
    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifact: makeArtifact({ query: 'subscription Users { id }' }),
      meta: {
        path: '/',
        operationType: 'subscription',
        query: `subscription  Users  {  id  }`
      }
    });
    expect(matched).toBe(true);
  });

  it('Should match operation name string', () => {
    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifact: makeArtifact({ operationName: 'Users' }),
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'Users'
      }
    });
    expect(matched).toBe(true);
  });

  it('Should warn and skip artifact without query or operationName', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifact: makeArtifact({ operationName: undefined, query: undefined }),
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'Users'
      }
    });

    expect(matched).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
