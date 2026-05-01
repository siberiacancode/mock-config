import { describe, expect, it } from 'vitest';

import type { GraphQLWsProtocolRouteConfig } from '@/utils/types';

import { calculateGraphQLWsProtocolRouteConfigWeight } from './calculateGraphQLWsProtocolRouteConfigWeight';

describe('calculateGraphQLWsProtocolRouteConfigWeight', () => {
  it('Should return 0 when entities is absent', () => {
    const config: GraphQLWsProtocolRouteConfig = { data: {} };
    expect(calculateGraphQLWsProtocolRouteConfigWeight(config)).toBe(0);
  });

  it('Should return 0 when variables is absent', () => {
    const config: GraphQLWsProtocolRouteConfig = { data: {}, entities: {} };
    expect(calculateGraphQLWsProtocolRouteConfigWeight(config)).toBe(0);
  });

  it('Should count keys for plain variables record', () => {
    const config: GraphQLWsProtocolRouteConfig = {
      data: {},
      entities: {
        variables: { a: '1', b: '2', c: '3' }
      }
    };
    expect(calculateGraphQLWsProtocolRouteConfigWeight(config)).toBe(3);
  });

  it('Should return 1 for exists checkMode', () => {
    const config: GraphQLWsProtocolRouteConfig = {
      data: {},
      entities: {
        variables: { checkMode: 'exists' as const }
      }
    };
    expect(calculateGraphQLWsProtocolRouteConfigWeight(config)).toBe(1);
  });

  it('Should count keys of descriptor value object when compare mode', () => {
    const config: GraphQLWsProtocolRouteConfig = {
      data: {},
      entities: {
        variables: {
          checkMode: 'equals' as const,
          value: { x: 1, y: 2 }
        }
      }
    };
    expect(calculateGraphQLWsProtocolRouteConfigWeight(config)).toBe(2);
  });
});
