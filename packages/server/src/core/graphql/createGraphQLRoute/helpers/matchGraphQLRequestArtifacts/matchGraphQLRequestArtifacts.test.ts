import { describe, expect, it, vi } from 'vitest';

import type { GraphQLRequestArtifact } from '@/utils/types';

import { matchGraphQLRequestArtifacts } from './matchGraphQLRequestArtifacts';

const makeArtifact = (overrides: Partial<GraphQLRequestArtifact>): GraphQLRequestArtifact =>
  ({
    baseUrl: '/',
    operationType: 'query',
    identifier: 'GetUsers',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as GraphQLRequestArtifact;

describe('matchGraphQLRequestArtifacts', () => {
  it('Should not match request path to artifact baseUrl', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/v1' })],
      meta: {
        path: '/v2',
        operationType: 'query',
        operationName: 'GetUsers'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should return empty when operation type mismatches', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'GetUsers' })],
      meta: {
        path: '/',
        operationType: 'mutation',
        operationName: 'GetUsers'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should match equivalent queries with different insignificant whitespace', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'query { User { name } }' })],
      meta: {
        path: '/',
        operationType: 'query',
        query: `query  {
          User  {  name  }
        }`
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match query by regexp identifier', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ identifier: /^\{User\{name\}\}$/ })],
      meta: {
        path: '/',
        operationType: 'query',
        query: `query {
          User { name }
        }`
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name string', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'GetUsers' })],
      meta: {
        path: '/',
        operationType: 'query',
        operationName: 'GetUsers'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name string when query exists', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'GetUsers' })],
      meta: {
        path: '/',
        operationType: 'query',
        query: 'query GetUsers { users { id } }',
        operationName: 'GetUsers'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match operation name regexp', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ identifier: /^Get(.+?)sers$/g })],
      meta: {
        path: '/',
        operationType: 'query',
        operationName: 'GetUsers'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match event name', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'user:created' })],
      meta: {
        path: '/',
        operationType: 'query',
        eventName: 'user:created'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should match event name string when query exists', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ identifier: 'users' })],
      meta: {
        path: '/',
        operationType: 'query',
        query: 'query GetUsers { users { id } }',
        eventName: 'users'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should return empty and warn when no match found', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const artifact = makeArtifact({ identifier: 'query { users { id } }' });
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [artifact],
      meta: {
        path: '/',
        operationType: 'query',
        query: 'query GetUsers { users { id } }',
        operationName: 'GetOther',
        eventName: 'user:updated'
      }
    });
    expect(matched).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(
      `[mock-config] GraphQL artifact was skipped: ${JSON.stringify(artifact)}`
    );
    warnSpy.mockRestore();
  });
});
