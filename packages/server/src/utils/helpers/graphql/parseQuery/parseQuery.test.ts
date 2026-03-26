import { describe, expect, it } from 'vitest';

import { parseQuery } from './parseQuery';

describe('parseQuery', () => {
  it('Should parse graphQL query', () => {
    const parsedQuery = parseQuery('query GetCharacters { characters { name } }');

    expect(parsedQuery).toStrictEqual({
      operationType: 'query',
      operationName: 'GetCharacters'
    });
  });

  it('Should parse graphQL mutation', () => {
    const parsedQuery = parseQuery(
      'mutation CreateCharacters($name: String!) { createCharacters(name: $name) { name } }'
    );

    expect(parsedQuery).toStrictEqual({
      operationType: 'mutation',
      operationName: 'CreateCharacters'
    });
  });

  it('Should parse graphQL query with empty operationName', () => {
    const parsedQuery = parseQuery('query { characters { name } }');

    expect(parsedQuery).toStrictEqual({
      operationType: 'query',
      operationName: undefined
    });
  });
});
