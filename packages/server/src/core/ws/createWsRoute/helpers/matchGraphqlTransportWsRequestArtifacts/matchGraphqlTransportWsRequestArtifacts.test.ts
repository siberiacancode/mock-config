import { describe, expect, it, vi } from 'vitest';

import type { GraphqlTransportWsRequestArtifact } from '@/utils/types';

import { matchGraphqlTransportWsRequestArtifacts } from './matchGraphqlTransportWsRequestArtifacts';

const makeArtifact = (overrides: Partial<GraphqlTransportWsRequestArtifact>) =>
  ({
    type: 'graphql-ws',
    baseUrl: '/',
    operationType: 'subscription',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as GraphqlTransportWsRequestArtifact;

describe('matchGraphqlTransportWsRequestArtifacts', () => {
  it('Should not match when path differs from baseUrl', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/sub', operationName: 'Users' })],
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
      artifacts: [makeArtifact({ operationName: 'Users' })],
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
      artifacts: [makeArtifact({ query: 'subscription Users { id }' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        query: `subscription  Users  {  id  }`
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name string', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ operationName: 'Users' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'Users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name regexp', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ operationName: /^users$/g })],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name regexp with case-insensitive flag', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ operationName: /^users$/i })],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'Users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match event name string', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ eventName: 'users' })],
      meta: {
        path: '/',
        operationType: 'subscription',
        eventName: 'users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match event name regexp', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ eventName: /^users$/g })],
      meta: {
        path: '/',
        operationType: 'subscription',
        eventName: 'users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match event name regexp with case-insensitive flag', () => {
    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [makeArtifact({ eventName: /^users$/i })],
      meta: {
        path: '/',
        operationType: 'subscription',
        eventName: 'Users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should correctly prioritize matching artifacts', () => {
    const queryMatched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [
        makeArtifact({
          query: 'subscription Users { users { id } }',
          eventName: 'users',
          operationName: 'Users'
        })
      ],
      meta: {
        path: '/',
        operationType: 'subscription',
        query: 'subscription Users { users { id } }',
        eventName: 'users',
        operationName: 'Users'
      }
    });

    expect(queryMatched).toHaveLength(1);

    const eventNameMatched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [
        makeArtifact({
          eventName: 'users',
          operationName: 'Users'
        })
      ],
      meta: {
        path: '/',
        operationType: 'subscription',
        eventName: 'users',
        operationName: 'Users'
      }
    });

    expect(eventNameMatched).toHaveLength(1);

    const operationNameMatched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [
        makeArtifact({
          operationName: 'Users'
        })
      ],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'Users'
      }
    });

    expect(operationNameMatched).toHaveLength(1);
  });

  it('Should warn and skip artifact without data', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const matched = matchGraphqlTransportWsRequestArtifacts({
      artifacts: [
        makeArtifact({
          operationName: undefined,
          query: undefined,
          eventName: undefined
        }) as GraphqlTransportWsRequestArtifact
      ],
      meta: {
        path: '/',
        operationType: 'subscription',
        operationName: 'Users',
        eventName: 'Users'
      }
    });

    expect(matched).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
