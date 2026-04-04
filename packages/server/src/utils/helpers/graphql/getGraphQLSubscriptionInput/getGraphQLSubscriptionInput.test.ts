import { describe, expect, it } from 'vitest';

import { getGraphQLSubscriptionInput } from './getGraphQLSubscriptionInput';

describe('getGraphQLSubscriptionInput', () => {
  it('Should get correct graphQL subscription input from object', () => {
    expect(
      getGraphQLSubscriptionInput({
        query: 'subscription S { a }',
        variables: { id: '1' }
      })
    ).toEqual({
      query: 'subscription S { a }',
      variables: { id: '1' }
    });
  });

  it('Should ignore non-string query', () => {
    expect(
      getGraphQLSubscriptionInput({
        query: 123,
        variables: {}
      })
    ).toEqual({
      query: undefined,
      variables: {}
    });
  });

  it('Should omit variables when not a plain object', () => {
    expect(
      getGraphQLSubscriptionInput({
        query: '{}',
        variables: [1, 2]
      })
    ).toEqual({
      query: '{}',
      variables: undefined
    });
  });
});
