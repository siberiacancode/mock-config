import { describe, expect, it } from 'vitest';

import type { RawWsRequestArtifact } from '@/utils/types';

import { matchRawRequestArtifacts } from './matchRawRequestArtifacts';

const makeArtifact = (overrides: Partial<RawWsRequestArtifact>) =>
  ({
    type: 'raw',
    baseUrl: '/',
    config: { data: () => ({ ok: true }) },
    weight: 0,
    ...overrides
  }) as RawWsRequestArtifact;

describe('matchRawRequestArtifacts', () => {
  it('Should match route configuration by baseUrl', () => {
    const matched = matchRawRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/chat' })],
      meta: {
        path: '/chat'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match route configuration by baseUrl prefix', () => {
    const matched = matchRawRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/chat' })],
      meta: {
        path: '/chat/room-1'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should not match when path differs from baseUrl', () => {
    const matched = matchRawRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/chat' })],
      meta: {
        path: '/other'
      }
    });
    expect(matched).toHaveLength(0);
  });
});
