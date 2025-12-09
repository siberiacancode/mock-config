import type { Request } from 'express';

import { getGraphQLInput } from './getGraphQLInput';

describe('getGraphQLInput', () => {
  it('Should get correct graphQL input from GET request (with object variables)', () => {
    const mockRequest = {
      method: 'GET',
      query: {
        query: 'query GetCharacters { characters { name } }',
        variables: { limit: 10 }
      }
    } as unknown as Request;

    const graphQLInput = getGraphQLInput(mockRequest);

    expect(graphQLInput).toStrictEqual({
      query: 'query GetCharacters { characters { name } }',
      variables: { limit: 10 }
    });
  });

  it('Should get correct graphQL input from GET request (with string variables)', () => {
    const mockRequest = {
      method: 'GET',
      query: {
        query: 'query GetCharacters { characters { name } }',
        variables: '{ "limit": 10 }'
      }
    } as unknown as Request;

    const graphQLInput = getGraphQLInput(mockRequest);

    expect(graphQLInput).toStrictEqual({
      query: 'query GetCharacters { characters { name } }',
      variables: { limit: 10 }
    });
  });

  it('Should get correct graphQL input from GET request with empty variables', () => {
    const mockRequest = {
      method: 'GET',
      query: {
        query: 'query GetCharacters { characters { name } }'
      }
    } as unknown as Request;

    const graphQLInput = getGraphQLInput(mockRequest);

    expect(graphQLInput).toStrictEqual({
      query: 'query GetCharacters { characters { name } }',
      variables: undefined
    });
  });

  it('Should get correct graphQL input from GET request with empty query and variables', () => {
    const mockRequest = {
      method: 'GET',
      query: {}
    } as unknown as Request;

    const graphQLInput = getGraphQLInput(mockRequest);

    expect(graphQLInput).toStrictEqual({
      query: undefined,
      variables: undefined
    });
  });

  it('Should get correct graphQL input from POST request', () => {
    const mockRequest = {
      method: 'POST',
      body: {
        query: 'query GetCharacters { characters { name } }',
        variables: { limit: 10 }
      }
    } as unknown as Request;

    const graphQLInput = getGraphQLInput(mockRequest);

    expect(graphQLInput).toStrictEqual({
      query: 'query GetCharacters { characters { name } }',
      variables: { limit: 10 }
    });
  });

  it('Should get correct graphQL input from POST with empty variables', () => {
    const mockRequest = {
      method: 'POST',
      body: {
        query: 'query GetCharacters { characters { name } }'
      }
    } as unknown as Request;

    const graphQLInput = getGraphQLInput(mockRequest);

    expect(graphQLInput).toStrictEqual({
      query: 'query GetCharacters { characters { name } }',
      variables: undefined
    });
  });

  it('Should get correct graphQL input from POST with empty query and variables', () => {
    const mockRequest = {
      method: 'POST',
      body: {}
    } as unknown as Request;

    const graphQLInput = getGraphQLInput(mockRequest);

    expect(graphQLInput).toStrictEqual({
      query: undefined,
      variables: undefined
    });
  });

  it('Should throw error if request method is not GET or POST', () => {
    const deleteMockRequest = {
      method: 'DELETE',
      query: {
        query: 'query GetCharacters { characters { name } }'
      }
    } as unknown as Request;

    expect(() => getGraphQLInput(deleteMockRequest)).toThrow(
      'Not allowed request method DELETE for graphql request'
    );

    const putMockRequest = {
      method: 'PUT',
      body: {
        query: 'query GetCharacters { characters { name } }'
      }
    } as unknown as Request;

    expect(() => getGraphQLInput(putMockRequest)).toThrow(
      'Not allowed request method PUT for graphql request'
    );
  });
});
