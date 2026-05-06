import { describe, expect, it } from 'vitest';

import type { GraphqlTransportWsRouteConfig } from '@/utils/types';

import { calculateGraphqlTransportWsRouteConfigWeight } from './calculateGraphqlTransportWsRouteConfigWeight';

describe('calculateGraphqlTransportWsRouteConfigWeight', () => {
  it('Should return 0 when entities is absent', () => {
    const config: GraphqlTransportWsRouteConfig = { data: {} };
    expect(calculateGraphqlTransportWsRouteConfigWeight(config)).toBe(0);
  });

  it('Should return 0 when variables is absent', () => {
    const config: GraphqlTransportWsRouteConfig = { data: {}, entities: {} };
    expect(calculateGraphqlTransportWsRouteConfigWeight(config)).toBe(0);
  });

  it('Should count keys for plain variables record', () => {
    const config: GraphqlTransportWsRouteConfig = {
      data: {},
      entities: {
        variables: { a: '1', b: '2', c: '3' }
      }
    };
    expect(calculateGraphqlTransportWsRouteConfigWeight(config)).toBe(3);
  });

  it('Should return 1 for exists checkMode', () => {
    const config: GraphqlTransportWsRouteConfig = {
      data: {},
      entities: {
        variables: { checkMode: 'exists' as const }
      }
    };
    expect(calculateGraphqlTransportWsRouteConfigWeight(config)).toBe(1);
  });

  it('Should count keys of descriptor value object when compare mode', () => {
    const config: GraphqlTransportWsRouteConfig = {
      data: {},
      entities: {
        variables: {
          checkMode: 'equals' as const,
          value: { x: 1, y: 2 }
        }
      }
    };
    expect(calculateGraphqlTransportWsRouteConfigWeight(config)).toBe(2);
  });
});
