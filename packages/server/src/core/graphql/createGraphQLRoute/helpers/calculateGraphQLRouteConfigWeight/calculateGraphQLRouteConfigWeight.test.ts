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
          query: { key: 'value' },
          variables: { key: 'value' }
        }
      })
    ).toBe(4);
  });

  it('Should add one for variables exists/notExists descriptor', () => {
    expect(
      calculateGraphQLRouteConfigWeight({
        data: {},
        entities: {
          variables: { checkMode: 'exists' }
        }
      })
    ).toBe(1);
  });

  it('Should count keys of variables descriptor value when it is a plain object', () => {
    expect(
      calculateGraphQLRouteConfigWeight({
        data: {},
        entities: {
          variables: {
            checkMode: 'equals',
            value: { a: 'value', b: 'value', c: 'value' }
          }
        }
      })
    ).toBe(3);
  });

  it('Should count plain object variables without descriptor', () => {
    expect(
      calculateGraphQLRouteConfigWeight({
        data: {},
        entities: {
          variables: { a: 'value', b: 'value' }
        }
      })
    ).toBe(2);
  });
});
