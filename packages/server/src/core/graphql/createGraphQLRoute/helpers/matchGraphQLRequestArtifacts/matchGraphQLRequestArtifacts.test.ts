import { describe, expect, it, vi } from 'vitest';

import type { BaseUrl, GraphQLRequestArtifact } from '@/utils/types';

import { matchGraphQLRequestArtifacts } from './matchGraphQLRequestArtifacts';

const makeArtifact = (overrides: Partial<GraphQLRequestArtifact>): GraphQLRequestArtifact =>
  ({
    baseUrl: '/' as BaseUrl,
    operationType: 'query',
    config: { data: { ok: true } },
    weight: 0,
    ...overrides
  }) as GraphQLRequestArtifact;

describe('matchGraphQLRequestArtifacts', () => {
  it('Should not match request path to artifact baseUrl', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ baseUrl: '/v1', operationName: 'GetUsers' })],
      meta: {
        path: '/v2',
        operationType: 'query',
        operationName: 'GetUsers'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should return empty when operationType mismatches', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ operationName: 'GetUsers' })],
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
      artifacts: [makeArtifact({ query: 'query { User { name } }' })],
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

  it('Should fail query match when meta query is missing', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ query: 'query { User { name } }' })],
      meta: {
        path: '/',
        operationType: 'query'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should fail query match when query strings differ', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ query: 'query { User { name } }' })],
      meta: {
        path: '/',
        operationType: 'query',
        query: 'query { User { id } }'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should match operation name string', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ operationName: 'GetUsers' })],
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
      artifacts: [makeArtifact({ operationName: /^Get(.+?)sers$/g })],
      meta: {
        path: '/',
        operationType: 'query',
        operationName: 'GetUsers'
      }
    });

    expect(matched).toHaveLength(1);
  });

  it('Should match event name string', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ eventName: 'GetUsers' })],
      meta: {
        path: '/',
        operationType: 'query',
        eventName: 'GetUsers'
      }
    });

    expect(matched).toHaveLength(1);
  });

  it('Should match event name regexp', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ eventName: /^Get(.+?)sers$/g })],
      meta: {
        path: '/',
        operationType: 'query',
        eventName: 'GetUsers'
      }
    });
    expect(matched).toHaveLength(1);
  });

  it('Should fail operation name string when names differ', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ operationName: 'GetUsers' })],
      meta: {
        path: '/',
        operationType: 'query',
        operationName: 'GetOther'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should fail operation name match when meta operation name is missing', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ operationName: 'GetUsers' })],
      meta: {
        path: '/',
        operationType: 'query',
        query: 'query { users { id } }'
      }
    });
    expect(matched).toHaveLength(0);
  });

  it('Should skip artifact with neither query nor operation name', () => {
    const warn = vi.spyOn(console, 'warn');
    const artifact = makeArtifact({});

    const matched = matchGraphQLRequestArtifacts({
      artifacts: [artifact],
      meta: {
        path: '/',
        operationType: 'query',
        operationName: 'GetUsers'
      }
    });

    expect(matched).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(
      `[mock-config] GraphQL artifact with no query or operationName was skipped: ${JSON.stringify(
        artifact
      )}`
    );
  });

  it('Should fail operation name regexp when pattern does not match', () => {
    const matched = matchGraphQLRequestArtifacts({
      artifacts: [makeArtifact({ operationName: /^Other$/ })],
      meta: {
        path: '/',
        operationType: 'query',
        query: 'query GetUsers { users { id } }',
        operationName: 'GetUsers'
      }
    });
    expect(matched).toHaveLength(0);
  });
});
