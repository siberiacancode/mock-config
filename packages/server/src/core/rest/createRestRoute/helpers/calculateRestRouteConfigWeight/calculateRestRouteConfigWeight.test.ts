import { describe, expect, it } from 'vitest';

import { calculateRestRouteConfigWeight } from './calculateRestRouteConfigWeight';

describe('calculateRestRouteConfigWeight', () => {
  it('Should return 0 when entities is absent', () => {
    expect(calculateRestRouteConfigWeight({ data: {} } as any)).toBe(0);
  });

  it('Should sum headers cookies query params', () => {
    expect(
      calculateRestRouteConfigWeight({
        data: {},
        entities: {
          headers: { key: 'value' },
          cookies: { key: 'value' },
          queries: { key: 'value' },
          params: { key: 'value' },
          body: { key: 'value' }
        }
      })
    ).toBe(5);
  });

  it('Should add one for non-plain body array', () => {
    expect(
      calculateRestRouteConfigWeight({
        data: {},
        entities: {
          body: [{ key: 'value' }]
        }
      })
    ).toBe(1);
  });
});
