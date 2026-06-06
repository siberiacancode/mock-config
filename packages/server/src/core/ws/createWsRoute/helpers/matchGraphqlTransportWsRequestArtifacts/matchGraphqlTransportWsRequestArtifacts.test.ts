import { describe, expect, it, vi } from 'vitest';

import type { GraphqlTransportWsRequestArtifact } from '@/utils/types';

import { matchGraphqlTransportWsRequestArtifacts } from './matchGraphqlTransportWsRequestArtifacts';

const makeArtifact = (overrides: Partial<GraphqlTransportWsRequestArtifact>) =>
  ({
    type: 'graphql-ws',
    baseUrl: '/',
    operationType: 'subscription',
    identifier: 'Users',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as GraphqlTransportWsRequestArtifact;

describe('matchGraphqlTransportWsRequestArtifacts', () => {
  it('Should not match when path differs from baseUrl', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/sub' })],
      meta: {
        path: '/other',
        operationType: 'subscription',
        operationName: 'Users'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should return empty when operationType is not subscription', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'Users' })],
      meta: {
        path: '/',
        operationType: 'query',
        operationName: 'Users'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should match equivalent queries with different insignificant whitespace', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'subscription Users { id }' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        query: 'subscription  Users  {  id  }'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match query by regexp identifier', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ identifier: /^subscription.*Users\{id\}$/ })],
      meta: {
        path: '/',
        operationType: 'subscription',
        query: 'subscription  Users  {  id  }'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name string', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'Users' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'Users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name string when query exists', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'Users' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        query: 'subscription Users { id }',
        operationName: 'Users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name regexp', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ identifier: /^users$/g })],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match event name', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'users:created' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        eventName: 'users:created'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match event name string when query exists', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'users' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        query: 'subscription UsersSub { users { id } }',
        eventName: 'users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should return empty and warn when no match found', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const artifact = makeArtifact({ identifier: 'Users' });
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [artifact],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'Other',
        eventName: 'users:created'
      }
    });
    expect(matched).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(
      `[mock-config] GraphQL artifact was skipped: ${JSON.stringify(artifact)}`
    );
    warnSpy.mockRestore();
  });
});
