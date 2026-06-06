import { describe, expect, it } from 'vitest';

import type { RestRequestArtifact } from '@/utils/types';

import { prepareRestRequestArtifacts } from './prepareRestRequestArtifacts';

const makeArtifact = (overrides: Partial<RestRequestArtifact>): RestRequestArtifact =>
  ({
    baseUrl: '/',
    method: 'get',
    path: '/users',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as RestRequestArtifact;

describe('prepareRestRequestArtifacts', () => {
  it('Should sort by weight descending', () => {
    const prepared = prepareRestRequestArtifacts([
      makeArtifact({ weight: 1 }),
      makeArtifact({ weight: 5 })
    ]);
    expect(prepared.map((a) => a.weight)).toEqual([5, 1]);
  });

  it('Should prefer static segment over parameter at first differing segment', () => {
    const prepared = prepareRestRequestArtifacts([
      makeArtifact({ path: '/users/:id' }),
      makeArtifact({ path: '/users/id' })
    ]);
    expect(prepared[0].path).toBe('/users/id');
    expect(prepared[1].path).toBe('/users/:id');
  });

  it('Should prefer more specific path over higher route weight', () => {
    const prepared = prepareRestRequestArtifacts([
      makeArtifact({ path: '/users/:id', weight: 100 }),
      makeArtifact({ path: '/users/me', weight: 1 })
    ]);
    expect(prepared[0].path).toBe('/users/me');
    expect(prepared[1].path).toBe('/users/:id');
  });

  it('Should not reorder two non-parameterized paths', () => {
    const prepared = prepareRestRequestArtifacts([
      makeArtifact({ path: '/first' }),
      makeArtifact({ path: '/second' })
    ]);
    expect(prepared[0].path).toBe('/first');
    expect(prepared[1].path).toBe('/second');
  });

  it('Should prefer parameter over wildcard at first differing segment', () => {
    const prepared = prepareRestRequestArtifacts([
      makeArtifact({ path: '/users/*' }),
      makeArtifact({ path: '/users/:id' })
    ]);
    expect(prepared[0].path).toBe('/users/:id');
    expect(prepared[1].path).toBe('/users/*');
  });

  it('Should prefer static segment over wildcard at first differing segment', () => {
    const prepared = prepareRestRequestArtifacts([
      makeArtifact({ path: '/users/**' }),
      makeArtifact({ path: '/users/me' })
    ]);
    expect(prepared[0].path).toBe('/users/me');
    expect(prepared[1].path).toBe('/users/**');
  });

  it('Should not reorder regexp paths', () => {
    const prepared = prepareRestRequestArtifacts([
      makeArtifact({ path: /^\/x$/ }),
      makeArtifact({ path: /^\/y$/ })
    ]);
    expect(prepared[0].path).toStrictEqual(/^\/x$/);
    expect(prepared[1].path).toStrictEqual(/^\/y$/);
  });
});
