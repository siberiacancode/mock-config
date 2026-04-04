import { describe, expect, it, vi } from 'vitest';

import type { BaseUrl, GraphQLSubscriptionRequestArtifact } from '@/utils/types';

import { matchGraphQLSubscriptionRequestArtifacts } from './matchGraphQLSubscriptionRequestArtifacts';

const makeArtifact = (
  overrides: Partial<GraphQLSubscriptionRequestArtifact>
): GraphQLSubscriptionRequestArtifact =>
  ({
    baseUrl: '/' as BaseUrl,
    operationType: 'subscription',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as GraphQLSubscriptionRequestArtifact;

describe('matchGraphQLSubscriptionRequestArtifacts', () => {
  it('Should not match when path differs from baseUrl', () => {
    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/sub', operationName: 'OnMsg' })],
      meta: {
        path: '/other',
        operationType: 'subscription',
        operationName: 'OnMsg'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should return empty when operationType is not subscription', () => {
    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifacts: [makeArtifact({ operationName: 'OnMsg' })],
      meta: {
        path: '/',
        operationType: 'query',
        operationName: 'OnMsg'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should match equivalent queries with different insignificant whitespace', () => {
    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifacts: [makeArtifact({ query: 'subscription Sub { x }' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        query: `subscription  Sub  {  x  }`
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name string', () => {
    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifacts: [makeArtifact({ operationName: 'OnCounter' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'OnCounter'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should warn and skip artifact without query or operationName', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const matched = matchGraphQLSubscriptionRequestArtifacts({
      artifacts: [makeArtifact({ operationName: undefined, query: undefined })],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'X'
      }
    });

    expect(matched).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
