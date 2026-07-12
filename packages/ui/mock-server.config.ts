import type { MockServerConfig } from 'mock-config-server';

import {
  endsWith,
  equals,
  exists,
  fn,
  includes,
  not,
  regExp,
  startsWith
} from 'mock-config-server';

const mockServerConfig: MockServerConfig = [
  {
    baseUrl: '/',
    port: 31299
  },
  // {
  //   port: 31299
  // },
  // {
  //   // staticPath: {
  //   //   path: '/images',
  //   //   prefix: '/files'
  //   // }
  //   // staticPath: [
  //   //   '/images',
  //   //   {
  //   //     path: '/images',
  //   //     prefix: '/files'
  //   //   }
  //   // ]
  //   staticPath: '/'
  // },
  // {
  //   cors: {
  //     // origin: () => new Promise((res) => 'https://www.google.com')
  //     // origin: () => 'https://www.google.com'
  //     // origin: ['https://www.google.com']
  //     origin: 'https://www.google.com',
  //     methods: ['GET'],
  //     allowedHeaders: ['accept'],
  //     exposedHeaders: ['accept'],
  //     maxAge: 3600,
  //     credentials: true
  //   },
  // },
  // {
  //   database: {
  //     data: {
  //       users: [{ id: 1, emoji: '🎉' }]
  //     },
  //     routes: {
  //       '/*/users/:id': '/api/users/:id'
  //     }
  //   }
  // },
  {
    configs: [] // annonymos
  },
  {
    name: 'entities',
    configs: [
      {
        method: 'get',
        path: '/user/:id',
        routes: [
          {
            data: { emoji: 'ууу' }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: 'token'
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              cookies: {
                auth: 'token'
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              queries: {
                sort: 'asc'
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              params: {
                id: '1'
              }
            }
          }
        ]
      }
    ]
  },
  {
    name: 'interceptors',
    configs: [
      {
        method: 'get',
        path: '/user/:id',
        routes: [
          {
            data: { emoji: '🎉' },
            interceptors: {
              request: () => {},
              response: (data: unknown) => data
            }
          }
        ],
        interceptors: {
          request: () => {},
          response: (data: unknown) => data
        }
      }
    ],
    interceptors: {
      request: () => {},
      response: (data) => data
    }
  },
  {
    name: 'comparators',
    configs: [
      {
        method: 'get',
        path: '/user/:id',
        routes: [
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: 'token'
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: exists()
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: not(exists())
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: equals('token')
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: not(equals('token'))
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: startsWith('token')
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: not(startsWith('token'))
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: includes('token')
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: not(includes('token'))
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: endsWith('token')
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: not(endsWith('token'))
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: regExp(/token/)
              }
            }
          },
          {
            data: { emoji: '🎉' },
            entities: {
              headers: {
                auth: fn((actualValue) => actualValue === 'token')
              }
            }
          }
        ]
      }
    ]
  }
];

export default mockServerConfig;
