// TODO: remove this file
import type { FlatMockServerConfig } from '@/utils/types';

import { equals, every, some } from './src/utils/helpers/entities/handlers';

const config: FlatMockServerConfig = [
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
              cookies: some({ cookie1: '123', cookie2: '456' }),
              headers: every({ header1: '123', header2: '456' }),
              queries: {
                //   query011: exists(), // ✅
                //
                //   query012: notExists(), // ✅
                //
                //   query021: equals({}), // ⛔️️ must be primitive
                //   query022: equals('123', false), // ✅
                //   query023: equals('123', true), // ⛔️️ must be array
                //   query024: equals(['123', 111, true], true), // ✅
                //   query025: equals(['123', 111, true], false), // ⛔️️ must not be array
                //   query026: equals(['123', 111, true]), // ⛔️️ must not be array
                //
                //   query031: notEquals('123'), // ✅
                //   query032: notEquals('123', false), // ✅
                //   query033: notEquals('123', true), // ⛔️️ must be array
                //   query034: notEquals(['123', 111, true], true), // ✅
                //   query035: notEquals(['123', 111, true], false), // ⛔️️ must not be array
                //
                //   query041: includes('123'), // ✅
                //   query042: includes('123', false), // ✅
                //   query043: includes('123', true), // ⛔️️ must be array
                //   query044: includes(['123', 111, true], true), // ✅
                //   query045: includes(['123', 111, true], false), // ⛔️️ must not be array
                //
                //   query051: notIncludes('123'), // ✅
                //   query052: notIncludes('123', false), // ✅
                //   query053: notIncludes('123', true), // ⛔️️ must be array
                //   query054: notIncludes(['123', 111, true], true), // ✅
                //   query055: notIncludes(['123', 111, true], false), // ⛔️️ must not be array
                //
                //   query061: startsWith('123'), // ✅
                //   query062: startsWith('123', false), // ✅
                //   query063: startsWith('123', true), // ⛔️️ must be array
                //   query064: startsWith(['123', 111, true], true), // ✅
                //   query065: startsWith(['123', 111, true], false), // ⛔️️ must not be array
                //
                //   query071: notStartsWith('123'), // ✅
                //   query072: notStartsWith('123', false), // ✅
                //   query073: notStartsWith('123', true), // ⛔️️ must be array
                //   query074: notStartsWith(['123', 111, true], true), // ✅
                //   query075: notStartsWith(['123', 111, true], false), // ⛔️️ must not be array
                //
                //   query081: endsWith('123'), // ✅
                //   query082: endsWith('123', false), // ✅
                //   query083: endsWith('123', true), // ⛔️️ must be array
                //   query084: endsWith(['123', 111, true], true), // ✅
                //   query085: endsWith(['123', 111, true], false), // ⛔️️ must not be array
                //
                //   query091: notEndsWith('123'), // ✅
                //   query092: notEndsWith('123', false), // ✅
                //   query093: notEndsWith('123', true), // ⛔️️ must be array
                //   query094: notEndsWith(['123', 111, true], true), // ✅
                //   query095: notEndsWith(['123', 111, true], false), // ⛔️️ must not be array
                //
                //   query101: regExp(/123/), // ✅
                //   query102: regExp(/123/, false), // ✅
                //   query103: regExp(/123/, true), // ⛔️️ must be array
                //   query104: regExp([/123/, /456/], true), // ✅
                //   query105: regExp([/123/, /456/], false), // ⛔️️ must not be array
                //   query106: regExp('123'), // ⛔️️ must be regExp
                //
                //   query111: fn((actualValue) => actualValue === 123), // ✅
                //   query112: fn((actualValue) => actualValue === 123, false), // ✅
                //   query113: fn((actualValue) => actualValue === 123, true), // ⛔️️ must be array
                //   query114: fn(
                //     [
                //       (actualValue) => actualValue === 'someString1',
                //       (actualValue) => actualValue === 'someString2'
                //     ],
                //     true
                //   ), // ✅
                //   query115: fn([(actualValue) => actualValue === 'someString1'], false), // ⛔️️ must not be array
                //   query116: fn('123'), // ⛔️️ must be function
                //   query117: fn(() => true), // ✅
                //   query118: fn((actualValue, checkFunction) =>
                //     checkFunction('equals', actualValue, 123)
                //   ) // ✅
              },
              // body: equals('123') // ⛔️️ must be object or array
              // body: equals('123', false), // ⛔️️ must be object or array
              // body: equals('123', true), // ⛔️️ must be array
              // body: equals([{ a: 123 }, { b: 'abc' }], true) // 💀 Type { a: number; b?: undefined; } is not assignable
              // body: equals(['123', 111, true], false) // ✅
              body: equals([{ a: 123 }]) // ✅
            },
            data: [{ id: 1 }, { id: 2 }]
          }
        ]
      }
    ]
  }
];

export default config;
