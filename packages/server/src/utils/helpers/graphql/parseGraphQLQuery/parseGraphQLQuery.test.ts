import { describe, expect, it } from 'vitest';

import { parseGraphQLQuery } from './parseGraphQLQuery';

describe('parseGraphQLQuery', () => {
  it('Should parse graphQL query', () => {
    const parsedQuery = parseGraphQLQuery('query GetCharacters { characters { name } }');

    expect(parsedQuery).toStrictEqual({
      operationType: 'query',
      operationName: 'GetCharacters'
    });
  });

  it('Should parse graphQL mutation', () => {
    const parsedQuery = parseGraphQLQuery(
      'mutation CreateCharacters($name: String!) { createCharacters(name: $name) { name } }'
    );

    expect(parsedQuery).toStrictEqual({
      operationType: 'mutation',
      operationName: 'CreateCharacters'
    });
  });

  it('Should parse graphQL query with empty operationName', () => {
    const parsedQuery = parseGraphQLQuery('query { characters { name } }');

    expect(parsedQuery).toStrictEqual({
      operationType: 'query',
      operationName: undefined
    });
  });
});
