import { describe, expect, it } from 'vitest';

import { parseGraphQLQuery } from './parseGraphQLQuery';

describe('parseGraphQLQuery', () => {
  it('Should parse graphQL query', () => {
    const parsedQuery = parseGraphQLQuery('query GetCharacters { characters { name } }');

    expect(parsedQuery).toStrictEqual({
      eventName: 'characters',
      operationType: 'query',
      operationName: 'GetCharacters'
    });
  });

  it('Should parse graphQL mutation', () => {
    const parsedQuery = parseGraphQLQuery(
      'mutation CreateCharacters($name: String!) { createCharacters(name: $name) { name } }'
    );

    expect(parsedQuery).toStrictEqual({
      eventName: 'createCharacters',
      operationType: 'mutation',
      operationName: 'CreateCharacters'
    });
  });

  it('Should parse graphQL query with empty operationName', () => {
    const parsedQuery = parseGraphQLQuery('query { users { name } }');

    expect(parsedQuery).toStrictEqual({
      eventName: 'users',
      operationType: 'query',
      operationName: undefined
    });
  });
});
