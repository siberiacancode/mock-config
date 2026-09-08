import { describe, expect, it } from 'vitest';

import { equals } from '../../../../entities';
import { calculateWsRouteConfigWeight } from './calculateWsRouteConfigWeight';

describe('calculateWsRouteConfigWeight', () => {
  it('Should return 0 when entities is absent', () => {
    expect(calculateWsRouteConfigWeight({ data: () => ({}) })).toBe(0);
  });

  it('Should sum keys of every entity', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: () => ({}),
        entities: {
          cookies: { token: 'value' },
          headers: { 'x-api-key': 'value', 'x-request-id': 'value' }
        }
      })
    ).toBe(3);
  });

  it('Should count plain entity value as a single key', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: () => ({}),
        entities: {
          data: 'ping',
          isBinary: false
        }
      })
    ).toBe(2);
  });

  it('Should count comparator as a single key', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: () => ({}),
        entities: {
          data: equals({ type: 'ping', id: 1 })
        }
      })
    ).toBe(1);
  });
});
