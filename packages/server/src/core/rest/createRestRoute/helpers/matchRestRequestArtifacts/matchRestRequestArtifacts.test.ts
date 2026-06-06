import { describe, expect, it } from 'vitest';

import type { RestRequestArtifact } from '@/utils/types';

import { matchRestRequestArtifacts } from './matchRestRequestArtifacts';

const makeArtifact = (overrides: Partial<RestRequestArtifact>): RestRequestArtifact =>
  ({
    baseUrl: '/',
    method: 'get',
    path: '/users',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as RestRequestArtifact;

describe('matchRestRequestArtifacts', () => {
  it('Should not match request path to artifact baseUrl segment', () => {
    const matched = matchRestRequestArtifacts({
      artifacts: [
        makeArtifact({
          baseUrl: '/v1',
          path: '/users'
        })
      ],
      meta: { method: 'get', path: '/v2/users' }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should return empty when method mismatches', () => {
    const matched = matchRestRequestArtifacts({
      artifacts: [makeArtifact({ method: 'post' })],
      meta: { method: 'get', path: '/users' }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should match regexp against full request path', () => {
    const matched = matchRestRequestArtifacts({
      artifacts: [
        makeArtifact({
          baseUrl: '/',
          path: /^\/us(.+?)rs$/
        })
      ],
      meta: { method: 'get', path: '/users' }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match regexp against tail after non-root baseUrl', () => {
    const matched = matchRestRequestArtifacts({
      artifacts: [
        makeArtifact({
          baseUrl: '/api',
          path: /^\/users$/
        })
      ],
      meta: { method: 'get', path: '/api/users' }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should fail regexp when tail does not match', () => {
    const matched = matchRestRequestArtifacts({
      artifacts: [
        makeArtifact({
          baseUrl: '/api',
          path: /^\/other$/
        })
      ],
      meta: { method: 'get', path: '/api/users' }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should match string path with route params', () => {
    const matched = matchRestRequestArtifacts({
      artifacts: [
        makeArtifact({
          baseUrl: '/api',
          path: '/users/:id'
        })
      ],
      meta: { method: 'get', path: '/api/users/1' }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should fail string path when request does not match', () => {
    const matched = matchRestRequestArtifacts({
      artifacts: [makeArtifact({ path: '/users' })],
      meta: { method: 'get', path: '/user' }
    });
    expect(matched).toHaveLength(0);
  });
});
