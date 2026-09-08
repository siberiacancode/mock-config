import { describe, expect, it } from 'vitest';

import type { MessageWsRequestArtifact } from '@/utils/types';

import { matchMessageRequestArtifacts } from './matchMessageRequestArtifacts';

const makeArtifact = (overrides: Partial<MessageWsRequestArtifact>) =>
  ({
    type: 'raw',
    baseUrl: '/',
    config: { data: () => ({ ok: true }) },
    weight: 0,
    ...overrides
  }) as MessageWsRequestArtifact;

describe('matchMessageRequestArtifacts', () => {
  it('Should match route configuration by baseUrl', () => {
    const matched = matchMessageRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/chat' })],
      meta: {
        path: '/chat'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match route configuration by baseUrl prefix', () => {
    const matched = matchMessageRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/chat' })],
      meta: {
        path: '/chat/room-1'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should not match when path differs from baseUrl', () => {
    const matched = matchMessageRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/chat' })],
      meta: {
        path: '/other'
      }
    });
    expect(matched).toHaveLength(0);
  });
});
