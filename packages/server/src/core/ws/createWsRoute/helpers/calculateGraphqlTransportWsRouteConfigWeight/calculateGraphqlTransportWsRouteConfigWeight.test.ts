import { describe, expect, it } from 'vitest';

import type { GraphqlTransportWsRouteConfig } from '@/utils/types';

import { calculateGraphqlTransportWsRouteConfigWeight } from './calculateGraphqlTransportWsRouteConfigWeight';

describe('calculateGraphqlTransportWsRouteConfigWeight', () => {
  it('Should return 0 when entities is absent', () => {
    const config: GraphqlTransportWsRouteConfig = { data: {} };
    expect(calculateGraphqlTransportWsRouteConfigWeight(config)).toBe(0);
  });

  it('Should sum keys of entities', () => {
    expect(
      calculateGraphqlTransportWsRouteConfigWeight({
        data: {},
        entities: {
          variables: { key: 'value' }
        }
      })
    ).toBe(1);
  });
});
