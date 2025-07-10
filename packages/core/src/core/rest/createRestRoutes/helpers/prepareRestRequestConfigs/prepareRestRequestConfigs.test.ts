import type { RestRequestConfig } from '@/utils/types';

import { prepareRestRequestConfigs } from './prepareRestRequestConfigs';

describe('prepareRestRequestConfigs', () => {
  it('Should sort request configs only when equal position path parts is parameter and non-parameter (non-parameter should be ahead)', () => {
    const restRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'get',
        routes: []
      },
      {
        path: /\/user/,
        method: 'get',
        routes: []
      },
      {
        path: '/settings/:id2/:id3/:id4/:id5/',
        method: 'get',
        routes: []
      },
      {
        path: '/users/:id2/:id3/4/:id5/',
        method: 'get',
        routes: []
      },
      {
        path: '/users/:id2/3/:id4/:id5',
        method: 'get',
        routes: []
      }
    ];
    const expectedRestRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'get',
        routes: []
      },
      {
        path: /\/user/,
        method: 'get',
        routes: []
      },
      {
        path: '/settings/:id2/:id3/:id4/:id5/',
        method: 'get',
        routes: []
      },
      {
        path: '/users/:id2/3/:id4/:id5',
        method: 'get',
        routes: []
      },
      {
        path: '/users/:id2/:id3/4/:id5/',
        method: 'get',
        routes: []
      }
    ];
    expect(prepareRestRequestConfigs(restRequestConfigs)).toStrictEqual(expectedRestRequestConfigs);
  });

  it('Should not sort routes if they do not contain entities', () => {
    const restRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'get',
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
    expect(prepareRestRequestConfigs(restRequestConfigs)).toStrictEqual(restRequestConfigs);
  });

  it('Should sort routes by their specificity of entities', () => {
    const restRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'get',
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
              }
            },
            data: { name: 'John', surname: 'Doe' }
          }
        ]
      }
    ];
    const expectedRestRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'get',
        routes: [
          {
            entities: {
              headers: {
                header1: 'value'
              },
              query: {
                query1: 'value',
                query2: 'value'
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
    expect(prepareRestRequestConfigs(restRequestConfigs)).toStrictEqual(expectedRestRequestConfigs);
  });

  it('Should set not object body weight equals to one', () => {
    const restRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'post',
        routes: [
          {
            entities: {
              body: [{}, {}, {}]
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
    const expectedRestRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'post',
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
              body: [{}, {}, {}]
            },
            data: { name: 'John', surname: 'Doe' }
          }
        ]
      }
    ];
    expect(prepareRestRequestConfigs(restRequestConfigs)).toStrictEqual(expectedRestRequestConfigs);
  });

  it('Should set descriptor body with value weight equals to body.value weight', () => {
    const restRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'post',
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
              body: {
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
    const expectedRestRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'post',
        routes: [
          {
            entities: {
              body: {
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
    expect(prepareRestRequestConfigs(restRequestConfigs)).toStrictEqual(expectedRestRequestConfigs);
  });

  it('Should set descriptor body without value weight equals to one', () => {
    const restRequestConfigs: RestRequestConfig[] = [
      {
        path: '/user',
        method: 'post',
        routes: [
          {
            entities: {
              body: {
                checkMode: 'exists'
              }
            },
            data: { name: 'John', surname: 'Doe' }
          },
          {
            entities: {
              body: {
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
    expect(prepareRestRequestConfigs(restRequestConfigs)).toStrictEqual(restRequestConfigs);
  });
});
