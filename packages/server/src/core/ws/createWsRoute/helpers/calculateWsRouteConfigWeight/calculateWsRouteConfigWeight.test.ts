import { describe, expect, it } from 'vitest';

import { calculateWsRouteConfigWeight } from './calculateWsRouteConfigWeight';

describe('calculateWsRouteConfigWeight', () => {
  it('Should return 0 when entities is absent', () => {
    expect(calculateWsRouteConfigWeight({ data: {} })).toBe(0);
  });

  it('Should count keys of plain object meta without descriptor', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: {},
        entities: {
          meta: { a: 'value', b: 'value' }
        }
      })
    ).toBe(2);
  });

  it('Should add one for meta exists/notExists descriptor', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: {},
        entities: {
          meta: { checkMode: 'exists' }
        }
      })
    ).toBe(1);

    expect(
      calculateWsRouteConfigWeight({
        data: {},
        entities: {
          meta: { checkMode: 'notExists' }
        }
      })
    ).toBe(1);
  });

  it('Should count keys of meta descriptor value when it is a plain object', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: {},
        entities: {
          meta: {
            checkMode: 'equals',
            value: { a: 'value', b: 'value', c: 'value' }
          }
        }
      })
    ).toBe(3);
  });

  it('Should count keys of plain object payload without descriptor', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: {},
        entities: {
          payload: { x: 1, y: 2 }
        }
      })
    ).toBe(2);
  });

  it('Should add one for payload exists/notExists descriptor and return without adding meta', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: {},
        entities: {
          payload: { checkMode: 'exists' }
        }
      })
    ).toBe(1);
  });

  it('Should count keys of payload descriptor value when it is a plain object', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: {},
        entities: {
          payload: {
            checkMode: 'equals',
            value: { a: 1, b: 2 }
          }
        }
      })
    ).toBe(2);
  });

  it('Should sum meta and payload weights when both present', () => {
    expect(
      calculateWsRouteConfigWeight({
        data: {},
        entities: {
          meta: { checkMode: 'exists' },
          payload: { checkMode: 'exists' }
        }
      })
    ).toBe(2);
  });
});
