import { describe, expect, it } from 'vitest';

import type { BaseUrl, WsRequestArtifact } from '@/utils/types';

import { prepareWsRequestArtifacts } from './prepareWsRequestArtifacts';

const makeArtifact = (overrides: Partial<WsRequestArtifact>): WsRequestArtifact =>
  ({
    baseUrl: '/' as BaseUrl,
    protocol: 'raw',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as WsRequestArtifact;

describe('prepareWsRequestArtifacts', () => {
  it('Should sort by weight descending', () => {
    const prepared = prepareWsRequestArtifacts([
      makeArtifact({ weight: 1 }),
      makeArtifact({ weight: 10 })
    ]);
    expect(prepared.map((a) => a.weight)).toEqual([10, 1]);
  });
});
