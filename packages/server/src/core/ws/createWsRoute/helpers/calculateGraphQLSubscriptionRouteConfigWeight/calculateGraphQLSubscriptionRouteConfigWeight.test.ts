import { describe, expect, it } from 'vitest';

import type { GraphQLSubscriptionRouteConfig } from '@/utils/types';

import { calculateGraphQLSubscriptionRouteConfigWeight } from './calculateGraphQLSubscriptionRouteConfigWeight';

describe('calculateGraphQLSubscriptionRouteConfigWeight', () => {
  it('Should return 0 when entities is absent', () => {
    const config: GraphQLSubscriptionRouteConfig = { data: {} };
    expect(calculateGraphQLSubscriptionRouteConfigWeight(config)).toBe(0);
  });

  it('Should return 0 when variables is absent', () => {
    const config: GraphQLSubscriptionRouteConfig = { data: {}, entities: {} };
    expect(calculateGraphQLSubscriptionRouteConfigWeight(config)).toBe(0);
  });

  it('Should count keys for plain variables record', () => {
    const config: GraphQLSubscriptionRouteConfig = {
      data: {},
      entities: {
        variables: { a: '1', b: '2', c: '3' }
      }
    };
    expect(calculateGraphQLSubscriptionRouteConfigWeight(config)).toBe(3);
  });

  it('Should return 1 for exists checkMode', () => {
    const config: GraphQLSubscriptionRouteConfig = {
      data: {},
      entities: {
        variables: { checkMode: 'exists' as const }
      }
    };
    expect(calculateGraphQLSubscriptionRouteConfigWeight(config)).toBe(1);
  });

  it('Should count keys of descriptor value object when compare mode', () => {
    const config: GraphQLSubscriptionRouteConfig = {
      data: {},
      entities: {
        variables: {
          checkMode: 'equals' as const,
          value: { x: 1, y: 2 }
        }
      }
    };
    expect(calculateGraphQLSubscriptionRouteConfigWeight(config)).toBe(2);
  });
});
