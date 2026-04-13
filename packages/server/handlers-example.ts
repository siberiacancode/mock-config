// TODO: remove this file
import type { MockServerConfig } from '@/utils/types';

import {
  endsWith,
  equals,
  exists,
  includes,
  notEndsWith,
  notEquals,
  notExists,
  notIncludes,
  notStartsWith,
  regExp,
  startsWith
} from './src/utils/helpers/entities/handlers';

const config: MockServerConfig = [
  {
    baseUrl: '/api',
    port: 31299
  },
  {
    baseUrl: '/rest',
    configs: [
      {
        method: 'post',
        path: '/users/:userId',
        routes: [
          {
            entities: {
              // cookies: some({ cookie1: '123', cookie2: '456' }),
              // headers: every({ header1: '123', header2: '456' }),
              queries: {
                query011: exists(), // ✅
                // query012: exists(''), // ⛔️️ must have no params

                query013: notExists(), // ✅
                // query014: notExists(''), // ⛔️️ must have no params

                query022: equals('123'), // ✅

                query031: notEquals('123'), // ✅

                query041: includes('123'), // ✅

                query051: notIncludes('123'), // ✅

                query061: startsWith('123'), // ✅

                query071: notStartsWith('123'), // ✅

                query081: endsWith('123'), // ✅

                query091: notEndsWith('123'), // ✅

                query101: regExp(/123/) // ✅
                // query106: regExp('123') // ⛔️️ must be regExp
                //
                // TODO: replace checkFunction with { equals, startsWith, ...}
                //   query112: fn((actualValue) => actualValue === 123), // ✅
                //   query114: fn((actualValue) => actualValue === 'someString1'), // ✅
                //   query115: fn((actualValue) => actualValue === 'someString1'), // ⛔️️ must not be array
                //   query116: fn('123'), // ⛔️️ must be function
                //   query117: fn(() => true), // ✅
                //   query118: fn((actualValue, checkFunction) => checkFunction('equals', actualValue)) // ✅
                // },
                // body: ''
                // TODO: make body: any
                // body: equals('123') // ⛔️️ must be object or array
                // body: equals('123', false), // ⛔️️ must be object or array
                // body: equals('123', true), // ⛔️️ must be array
                // body: equals([{ a: 123 }, { b: 'abc' }], true) // 💀 Type { a: number; b?: undefined; } is not assignable
                // body: equals(['123', 111, true], false) // ✅
                // body: equals([{ a: 123 }]) // ✅
              }
            },
            data: [{ id: 1 }, { id: 2 }]
          }
        ]
      }
    ]
  }
];

export default config;
