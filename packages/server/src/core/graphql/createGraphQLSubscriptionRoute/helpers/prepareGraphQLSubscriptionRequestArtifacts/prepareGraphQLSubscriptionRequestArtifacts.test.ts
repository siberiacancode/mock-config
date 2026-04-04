import { describe, expect, it } from 'vitest';

import type { BaseUrl, GraphQLSubscriptionRequestArtifact } from '@/utils/types';

import { prepareGraphQLSubscriptionRequestArtifacts } from './prepareGraphQLSubscriptionRequestArtifacts';

const makeArtifact = (
  overrides: Partial<GraphQLSubscriptionRequestArtifact>
): GraphQLSubscriptionRequestArtifact =>
  ({
    baseUrl: '/' as BaseUrl,
    operationType: 'subscription',
    operationName: 'Sub',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as GraphQLSubscriptionRequestArtifact;

describe('prepareGraphQLSubscriptionRequestArtifacts', () => {
  it('Should sort by weight descending', () => {
    const prepared = prepareGraphQLSubscriptionRequestArtifacts([
      makeArtifact({ weight: 1 }),
      makeArtifact({ weight: 10 })
    ]);
    expect(prepared.map((a) => a.weight)).toEqual([10, 1]);
  });
});
