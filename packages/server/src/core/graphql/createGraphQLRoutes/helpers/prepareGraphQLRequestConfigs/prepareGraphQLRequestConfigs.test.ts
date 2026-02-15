import { describe, expect, it } from 'vitest';

import type { GraphQLRequestConfig } from '@/utils/types';

import { prepareGraphQLRequestConfigs } from './prepareGraphQLRequestConfigs';

describe('prepareGraphQLRequestConfigs', () => {
  it('Should not sort routes if they does not contain entities', () => {
    const graphQLRequestConfigs: GraphQLRequestConfig[] = [
      {
        operationName: 'GetUser',
        operationType: 'query',
        routes: [
          {
            data: { name: 'John', surname: 'Doe' }
          },
          {
            data: { name: 'John', surname: 'Smith' }
          },
          {
            data: { name: 'John', surname: 'John' }
          }
        ]
      }
    ];
    expect(prepareGraphQLRequestConfigs(graphQLRequestConfigs)).toStrictEqual(
      graphQLRequestConfigs
    );
  });

  it('Should sort routes by their specificity of entities', () => {
    const graphQLRequestConfigs: GraphQLRequestConfig[] = [
      {
        operationName: 'GetUser',
        operationType: 'query',
        routes: [
          {
            entities: {
              headers: {
                header1: 'value'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          },
          {
            entities: {
              headers: {
                header1: 'value',
                header2: 'value'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          },
          {
            entities: {
              headers: {
                header1: 'value'
              },
              query: {
                query1: 'value',
                query2: 'value'
              },
              variables: {
                variable1: 'value1',
                variable2: 'value2'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          }
        ]
      }
    ];
    const expectedGraphQLRequestConfigs: GraphQLRequestConfig[] = [
      {
        operationName: 'GetUser',
        operationType: 'query',
        routes: [
          {
            entities: {
              headers: {
                header1: 'value'
              },
              query: {
                query1: 'value',
                query2: 'value'
              },
              variables: {
                variable1: 'value1',
                variable2: 'value2'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          },
          {
            entities: {
              headers: {
                header1: 'value',
                header2: 'value'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          },
          {
            entities: {
              headers: {
                header1: 'value'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          }
        ]
      }
    ];
    expect(prepareGraphQLRequestConfigs(graphQLRequestConfigs)).toStrictEqual(
      expectedGraphQLRequestConfigs
    );
  });

  it('Should set descriptor variables with value weight equals to variables.value weight', () => {
    const graphQLRequestConfigs: GraphQLRequestConfig[] = [
      {
        operationName: 'GetUser',
        operationType: 'query',
        routes: [
          {
            entities: {
              headers: {
                header1: 'value',
                header2: 'value'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          },
          {
            entities: {
              variables: {
                checkMode: 'equals',
                value: {
                  key1: 'value',
                  key2: 'value',
                  key3: 'value'
                }
              }
            },
            data: { name: 'John', surname: 'Doe' }
          }
        ]
      }
    ];
    const expectedGraphQLRequestConfigs: GraphQLRequestConfig[] = [
      {
        operationName: 'GetUser',
        operationType: 'query',
        routes: [
          {
            entities: {
              variables: {
                checkMode: 'equals',
                value: {
                  key1: 'value',
                  key2: 'value',
                  key3: 'value'
                }
              }
            },
            data: { name: 'John', surname: 'Doe' }
          },
          {
            entities: {
              headers: {
                header1: 'value',
                header2: 'value'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          }
        ]
      }
    ];
    expect(prepareGraphQLRequestConfigs(graphQLRequestConfigs)).toStrictEqual(
      expectedGraphQLRequestConfigs
    );
  });

  it('Should set descriptor variables without value weight equals to one', () => {
    const graphQLRequestConfigs: GraphQLRequestConfig[] = [
      {
        operationName: 'GetUser',
        operationType: 'query',
        routes: [
          {
            entities: {
              variables: {
                checkMode: 'exists'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          },
          {
            entities: {
              variables: {
                checkMode: 'notExists'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          },
          {
            entities: {
              headers: {
                header1: 'value'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          }
        ]
      }
    ];
    expect(prepareGraphQLRequestConfigs(graphQLRequestConfigs)).toStrictEqual(
      graphQLRequestConfigs
    );
  });
});
