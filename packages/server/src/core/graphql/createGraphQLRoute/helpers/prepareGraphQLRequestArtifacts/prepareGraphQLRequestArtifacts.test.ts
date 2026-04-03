import { describe, expect, it } from 'vitest';

import type { BaseUrl, GraphQLRequestArtifact } from '@/utils/types';

import { prepareGraphQLRequestArtifacts } from './prepareGraphQLRequestArtifacts';

const makeArtifact = (overrides: Partial<GraphQLRequestArtifact>): GraphQLRequestArtifact =>
  ({
    baseUrl: '/' as BaseUrl,
    operationType: 'query',
    operationName: 'Query',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as GraphQLRequestArtifact;

describe('prepareGraphQLRequestArtifacts', () => {
  it('Should sort by weight descending', () => {
    const prepared = prepareGraphQLRequestArtifacts([
      makeArtifact({ weight: 1 }),
      makeArtifact({ weight: 10 })
    ]);
    expect(prepared.map((a) => a.weight)).toEqual([10, 1]);
  });
});
