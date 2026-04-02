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
          query: { key: 'value' },
          params: { key: 'value' },
          body: { key: 'value' }
        }
      })
    ).toBe(5);
  });

  it('Should add one for body exists/notExists descriptor', () => {
    expect(
      calculateRestRouteConfigWeight({
        data: {},
        entities: {
          body: { checkMode: 'exists' }
        }
      })
    ).toBe(1);
    expect(
      calculateRestRouteConfigWeight({
        data: {},
        entities: {
          body: { checkMode: 'notExists' }
        }
      })
    ).toBe(1);
  });

  it('Should count keys of body descriptor value when it is a plain object', () => {
    expect(
      calculateRestRouteConfigWeight({
        data: {},
        entities: {
          body: {
            checkMode: 'equals',
            value: { a: 'value', b: 'value', c: 'value' }
          }
        }
      })
    ).toBe(3);
  });

  it('Should add one for body descriptor scalar value', () => {
    expect(
      calculateRestRouteConfigWeight({
        data: {},
        entities: {
          body: {
            checkMode: 'equals',
            value: 'scalar'
          }
        } as any
      })
    ).toBe(1);
  });

  it('Should count plain object body without descriptor', () => {
    expect(
      calculateRestRouteConfigWeight({
        data: {},
        entities: {
          body: { key: 'value' }
        }
      })
    ).toBe(1);
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
