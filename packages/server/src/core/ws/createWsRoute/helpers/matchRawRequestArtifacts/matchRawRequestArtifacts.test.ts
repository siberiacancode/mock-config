import { describe, expect, it } from 'vitest';

import type { BaseUrl, RawWsRequestArtifact } from '@/utils/types';

import { matchRawRequestArtifacts } from './matchRawRequestArtifacts';

const makeArtifact = (overrides: Partial<RawWsRequestArtifact>) =>
  ({
    type: 'raw',
    baseUrl: '/' as BaseUrl,
    config: { data: () => ({ ok: true }) },
    weight: 0,
    ...overrides
  }) as RawWsRequestArtifact;

describe('matchRawRequestArtifacts', () => {
  it('Should match route configuration by baseUrl', () => {
    const matched = matchRawRequestArtifacts({
      artifact: makeArtifact({ baseUrl: '/chat' as BaseUrl }),
      meta: {
        path: '/chat'
      }
    });

    expect(matched).toBe(true);
  });

  it('Should match route configuration by baseUrl prefix', () => {
    const matched = matchRawRequestArtifacts({
      artifact: makeArtifact({ baseUrl: '/chat' as BaseUrl }),
      meta: {
        path: '/chat/room-1'
      }
    });

    expect(matched).toBe(true);
  });

  it('Should not match when path differs from baseUrl', () => {
    const matched = matchRawRequestArtifacts({
      artifact: makeArtifact({ baseUrl: '/chat' as BaseUrl }),
      meta: {
        path: '/other'
      }
    });

    expect(matched).toBe(false);
  });
});
