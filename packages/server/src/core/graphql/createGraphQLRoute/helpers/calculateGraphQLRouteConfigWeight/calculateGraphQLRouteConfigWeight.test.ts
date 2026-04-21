import { describe, expect, it } from 'vitest';

import { calculateGraphQLRouteConfigWeight } from './calculateGraphQLRouteConfigWeight';

describe('calculateGraphQLRouteConfigWeight', () => {
  it('Should return 0 when entities is absent', () => {
    expect(calculateGraphQLRouteConfigWeight({ data: {} } as any)).toBe(0);
  });

  it('Should sum keys of entities', () => {
    expect(
      calculateGraphQLRouteConfigWeight({
        data: {},
        entities: {
          headers: { key: 'value' },
          cookies: { key: 'value' },
          queries: { key: 'value' },
          variables: { key: 'value' }
        }
      })
    ).toBe(4);
  });
});
