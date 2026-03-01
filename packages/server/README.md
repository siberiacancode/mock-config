# 🎉 Mock Config Server

tool that easily and quickly imitates server operation, create full fake api in few steps

## Install

Install with [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

```bash
$ npm i mock-config-server --save --dev
# or
$ yarn add mock-config-server --dev
```

## 🦉 Philosophy

**🎉 Mock Config Server** it is a tool that, easily, quickly simulates the work of a server. The main difference from solutions such as [json-server](https://www.npmjs.com/package/json-server) and [mock-service-worker](https://mswjs.io/) is the ease of filling in data and flexible emulation of any and usual cases. Our goal is to create a simple and flexible system for users, with the help of which they can create, test, and support their products.

## Features

- **TypeScript support out of the box** - full typed package
- **Full Rest Api support** - using simple configs of a certain format, you can easily simulate rest operation of servers
- **GraphQL support** - using simple configs of a certain format, you can easily simulate graphlql operation of servers
- **Database** - use mock database with all CRUD operations
- **CORS setup** - turn on and off CORS, fully customizable when CORS is turned on
- **Support for any kind of static** - server can return any type of static file if needed. Images, HTML, CSS, JSON, etc

## Usage

Install **🎉 Mock Config Server** with [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

```bash
$ npm i mock-config-server --save --dev
# or
$ yarn add mock-config-server --dev
```

Create a `mock-server.config.js` file with server configuration

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/user',
        method: 'get',
        routes: [{ data: { emoji: '🦁', name: 'Nursultan' } }]
      }
    ]
  }
];

export default flatMockServerConfig;
```

Start **🎉 Mock Config Server**

```bash
$ npx mock-config-server
```

> If the package is already installed you can use short command `mcs`

## 🎭 Parameters for mock-server.config.(js|ts)

### Settings

- `staticPath?` {StaticPath} entity for working with static files, [read](#static-path)
- `interceptors?` {Interceptors} functions to change request or response parameters, [read](#interceptors)
- `cors?` {Cors} CORS settings object (default: `CORS is turn off`), [read](#cors)
- `port?` {number} server port (default: `31299`)
- `baseUrl?` {string} part of the url that will be substituted at the beginning of the request url (default: `'/'`)
- `database?` Database config for mock requests [read](#database)
  - `data` {Object | string} initial data for database
  - `routes?` {Object | string} map of custom routes for database

### Components

- `name` {string} name of component
- `baseUrl?` {string} part of the url that will be substituted at the beginning of rest request url (default: `'/'`)
- `configs` {Array<RestRequestConfig | GraphQLRequestConfig>} configs for mock requests, [read](#configs)
  - `interceptors?` {Interceptors} functions to change request or response parameters, [read](#interceptors)

### Configs

Configs are the fundamental part of the mock server. These configs are easy to fill and maintain. Config entities is an object with which you can emulate various application behaviors. You can specify `headers` | `cookies` | `query` | `params` | `body` for Rest request or `headers` | `cookies` | `query` | `variables` for GraphQL request to define what contract data you need to get. Using this mechanism, you can easily simulate the operation of the server and emulate various cases

#### Rest request config

Every route must be configured to handle response content in one of three ways: data or [queue](#polling) or [file](#file-responses).

- `path` `string | RegExp` request path
- `method` `'get' | 'post' | 'delete' | 'put' | 'patch' | 'options'` rest api method
- `routes` `RestRouteConfig[]` request routes
  - `data?` `any` mock data of request
  - `queue?` `Array<{ time?: number; data: any}>` queue for polling with opportunity to set time for each response
  - `file?` `string` path to file for return in response
  - `settings?` `Settings` settings for route (polling on/off, etc.)
  - `entities?` `Object<headers | cookies | query | params | body>` object that helps in data retrieval
  - `interceptors?` `Interceptors` functions to change request or response parameters, [read](#interceptors)
- `interceptors?` `Interceptors` functions to change request or response parameters, [read](#interceptors)

##### Rest example

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/user',
        method: 'get',
        routes: [
          {
            entities: {
              headers: { 'name-header': 'Nursultan' }
            },
            data: { emoji: '🦁', name: 'Nursultan' }
          },
          {
            entities: {
              headers: { 'name-header': 'Dmitriy' }
            },
            data: { emoji: '☄', name: 'Dmitriy' }
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

Now you can make a request with an additional header and get the desired result

```javascript
fetch('http://localhost:31299/api/user', {
  headers: {
    'name-header': 'Nursultan',
    'Content-Type': 'application/json'
  }
})
  .then((response) => response.json())
  .then((data) => console.log(data)); // {  emoji: '🦁', name: 'Nursultan' }
```

#### GraphQL request config

Every route must be configured to handle response content in one of two ways: data or [queue](#polling).

- `operationType` `query | mutation` graphql operation type
- `operationName?` `string | RegExp` graphql operation name
- `query?`: `string` graphql query as string
- `routes` `GraphQLRouteConfig[]` request routes
  - `data?` `any` mock data of request
  - `queue?` `Array<{ time?: number; data: any}>` queue for polling with opportunity to set time for each response
  - `settings?` `Settings` settings for route (polling on/off, etc.)
  - `entities?` `Object<headers | cookies | query | variables>` object that helps in data retrieval
  - `interceptors?` `Interceptors` functions to change request or response parameters, [read](#interceptors)
- `interceptors?` `Interceptors` functions to change request or response parameters, [read](#interceptors)

> Every graphql config should contain `operationName` or `query` or both of them

##### GraphQL example

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/graphql'
  },
  {
    configs: [
      {
        operationType: 'query',
        operationName: 'GetUser',
        routes: [
          {
            entities: {
              headers: { 'name-header': 'Nursultan' }
            },
            data: { emoji: '🦁', name: 'Nursultan' }
          },
          {
            entities: {
              headers: { 'name-header': 'Dmitriy' }
            },
            data: { emoji: '☄', name: 'Dmitriy' }
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

Now you can make a request with an additional header and get the desired result

```javascript
const body = JSON.stringify({
  query: 'query GetUser { name }'
});

fetch('http://localhost:31299/graphql', {
  method: 'POST',
  headers: {
    'name-header': 'Nursultan',
    'Content-Type': 'application/json'
  },
  body
})
  .then((response) => response.json())
  .then((data) => console.log(data)); // {  emoji: '🦁', name: 'Nursultan' }
```

#### Entity descriptors

If you need more complex logic for matching entities, you can use entity descriptors.
Descriptor is an object with `checkMode` and `value` fields that describe how the correctness of the actual entity is calculated.

Allowed `checkModes`

- equals - checks actual value for equality with descriptor value (default).
- notEquals - checks actual value for non-equality with descriptor value.
- exists - checks actual value for existence i.e. any value.
- notExists - checks actual value for non-existence i.e. undefined value.
- includes - checks actual value for including with descriptor value.
- notIncludes - checks actual value for non-including with descriptor value.
- startsWith - checks actual value for starting with descriptor value.
- notStartsWith - checks actual value for non-starting with descriptor value.
- endsWith - checks actual value for ending with descriptor value.
- notEndsWith - checks actual value for non-ending with descriptor value.
- regExp - checks actual value with descriptor regExp.
- function - checks actual value with descriptor function.

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/user',
        method: 'get',
        routes: [
          {
            entities: {
              headers: {
                // 'name-header' is 'Dmitriy'
                'name-header': {
                  checkMode: 'equals',
                  value: 'Dmitriy'
                },
                // check for 'equals' if descriptor not provided
                // i.e. it is the same as `role: { checkMode: 'equals', value: 'developer' }`
                role: 'developer'
              },
              cookies: {
                // any 'token' cookie
                token: {
                  checkMode: 'exists'
                },
                // 'someSecretToken' cookie can be '123-abc' or '456-abc' for example
                someSecretToken: {
                  checkMode: 'regExp',
                  value: /^\d\d\d-abc$/
                }
              }
            },
            data: 'Some user data for Dmitriy'
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

#### Descriptor _oneOf_ property

For `checkMode` with the `value` property (all `checkMode` options except `exists` and `notExists`) you can use an array as value.
Mock server will find matches by iterating through the array until **some** match is found.
To be able to use this functionality you need to explicitly set `oneOf: true` property in descriptor object.

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/user',
        method: 'post',
        routes: [
          {
            entities: {
              // if body equals to { key1: 'value1' } OR { key2: 'value2' } then mock-config-server return 'Some user data 1'
              body: {
                checkMode: 'equals',
                value: [{ key1: 'value1' }, { key2: 'value2' }],
                oneOf: true
              }
            },
            data: 'Some user data 1'
          },
          {
            entities: {
              // if body equals to [{ key1: 'value1' }, { key2: 'value2' }] then mock-config-server return 'Some user data 2'
              // NO `oneOf` => array processed entirely
              body: {
                checkMode: 'equals',
                value: [{ key1: 'value1' }, { key2: 'value2' }]
              }
            },
            data: 'Some user data 2'
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

#### Function check mode

`function checkMode` is the most powerful way to describe your `entities` logic, but in most cases you will be fine using other `checkModes`.

`Function value` has the following signature `(actualValue, checkFunction) => boolean`.
Return `true` if `actualValue` matches your logic or `false` otherwise.

You can use the `checkFunction` from second argument if you want to describe your logic in a more declarative way.
`checkFunction` has the following signature `(checkMode, actualValue, descriptorValue?) => boolean`.

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/posts/:postId',
        method: 'post',
        routes: [
          {
            entities: {
              params: {
                postId: {
                  checkMode: 'function',
                  value: (actualValue) => +actualValue >= 0 && +actualValue <= 50
                }
              },
              cookies: {
                authToken: {
                  checkMode: 'function',
                  value: (actualValue, checkFunction) =>
                    checkFunction('equals', actualValue, 123) ||
                    checkFunction('startsWith', actualValue, 2)
                }
              }
            },
            data: 'Some user data'
          }
        ]
      }
    ]
  }
];

module.exports = flatMockServerConfig;
```

##### Using descriptors for part of REST body or GraphQL variables

If you want to check a deep nested property of your body or variables via descriptor you can use flatten object style. In this case server will check every field in entity with corresponding actual field. I.e. you can use descriptors only for properties of entity object (not for properties of nested objects).

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/users',
        method: 'post',
        routes: [
          {
            entities: {
              body: {
                // if body has properties like { user: { name: 'Sergey' } } OR { 'user.name': 'Sergey' } then mock-config-server return data
                'user.name': {
                  checkMode: 'equals',
                  value: 'Sergey'
                }
              }
            },
            data: 'user.name in body is "Sergey"'
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

You can also use descriptor for whole body or variables entity.

> When you use 'equals'/'notEquals' check mode for whole body or variables mock-config-server is strictly compare entity and actual value. It means that you must specify **ALL** properties from actual body or variables.

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/users',
        method: 'post',
        routes: [
          {
            entities: {
              body: {
                // if actual body contains some extra property(-ies) then this entity won't match
                checkMode: 'equals',
                value: {
                  user: {
                    name: 'Sergey',
                    emoji: '🐘',
                    roles: ['developer', 'moderator']
                  }
                }
              }
            },
            data: 'your body is strictly equals object from body entity value'
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

#### File responses

Rest routes support paths to files. If a route is matched, the server will send data from the file. If the file is not found, the server will return 404.

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/files/settings',
        method: 'get',
        routes: [
          {
            file: './settings.json'
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

> If the file path is absolute, then this path will be used as is. If the file path is relative, it will be appended to the current working directory.

If the file exists, response interceptors will receive `file descriptor` as the `data` argument:

`File descriptor` is an object with `path` and `file` fields that describe file location and file content.

- `path` `string` path to the file. Same as `file` passed in route
- `file` `Buffer` file content as binary buffer

> Note to return file descriptor from interceptor. Server will send a buffer from `data.file` with corresponding `Content-Type` and `Content-Disposition` headers.
> If you return invalid file descriptor, server will send it as json data.

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/files/settings',
        method: 'get',
        routes: [
          {
            file: './settings.json',
            interceptors: {
              response: (data) => {
                const { file, path } = data;
                const buffer = file; // some logic with buffer
                fs.writeFileSync(path, buffer); // rewrite ./settings.json file on disk with new content
                return { path, file: buffer };
              }
            }
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

> Any changes to the data will not affect the file on disk unless you manually rewrite it.

> If you return a new `path` from interceptor, server will send file corresponding to this path or 404 error otherwise.

#### Polling

Routes support polling for data. To add polling for data, you must specify the `polling setting` and use `queue` property instead of `data` or `file`.

`queue` is an array containing `data` or `file` that should be returned in order.

> After receiving the last value from polling, the queue is reset and the next request will return the first value from the queue.

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/user',
        method: 'get',
        routes: [
          {
            settings: { polling: true },
            queue: [
              { data: { emoji: '🦁', name: 'Nursultan' } },
              { data: { emoji: '☄', name: 'Dmitriy' } },
              { file: './users/Sergey.json' }
            ]
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

Using the additional `time` properties in milliseconds, you can specify how much time certain data should be returned

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/user',
        method: 'get',
        routes: [
          {
            settings: { polling: true },
            queue: [
              { time: 5000, data: { emoji: '🦁', name: 'Nursultan' } },
              { data: { emoji: '☄', name: 'Dmitriy' } }
            ]
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

#### Static Path

Entity for connecting statics to the server, like HTML, JSON, PNG, etc.

- `string` path to your static files
- `Object<{prefix, path}`
  - `prefix` `string` path prefix for request
  - `path` `string` path to your static files
- `Array<string | Object<{prefix, path}>>`

#### Cors

Object with settings for [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). You can flexibly configure the required origin, methods, headers, credentials, maxAge for the entire server. If you do not specify `CORS` settings, then it will be disabled.

- `origin` `string | RegExp | Array<string | RegExp> | Function | Promise` available origins from which requests can be made
- `methods?` `Array<GET | POST | DELETE | PUT | PATCH>` available methods (default: `GET,OPTIONS,PUT,PATCH,POST,DELETE`)
- `allowedHeaders?` `Array<string>` allowed headers (default: `*`)
- `exposedHeaders?` `Array<string>` exposed headers (default: `*`)
- `credentials?` `boolean` param tells browsers whether to expose the response to the frontend JavaScript code (default: `true`)
- `maxAge?` `number` how long the results can be cached (default: `3600`)

#### Interceptors

Functions to change request or response parameters

- `request?` `(params) => void`
- `response?` `(data, params) => any`

> request interceptors (except interceptor for route) are called regardless of whether the server found a route match or not. So changes in request interceptors can affect whether the server finds the route or not

##### Request

- `params`
  - `request` request object
  - `setDelay` `(delay) => Promise<void>`
    - `delay` `number` milliseconds of delay time
  - `getHeader` `(field) => string | number | string[] | undefined`
    - `field` `string` name of response header
  - `getHeaders` `() => Record<string | number | string[] | undefined>`
  - `getCookie` `(name) => string | undefined`
    - `name` `string` name of cookie
  - `log` `(logger) => Partial<LoggerTokens>` logger function [read](#logger)
    - `logger` `Logger | undefined` logger options

##### Response

- `data` `any` mock data of request
- `params`
  - `request` request object
  - `response` response object
  - `setDelay` `(delay) => Promise<void>`
    - `delay` `number` milliseconds of delay time
  - `setStatusCode` `(statusCode) => void`
    - `statusCode` `number` status code for response
  - `setHeader` `(field, value) => void`
    - `field` `string` name of response header
    - `value` `string | string[] | undefined` value of response header
  - `appendHeader` `(field, value) => void`
    - `field` `string` name of response header
    - `value` `string | string[] | undefined` value of response header
  - `getHeader` `(field) => string | number | string[] | undefined`
    - `field` `string` name of response header
  - `getHeaders` `() => Record<string | number | string[] | undefined>`
  - `setCookie` `(name, value, options) => void`
    - `name` `string` name of cookie
    - `value` `string` value of cookie
    - `options` `[CookieOptions](https://expressjs.com/en/resources/middleware/cookie-session.html) | undefined` cookie options (like path, expires, etc.)
  - `getCookie` `(name) => string | undefined`
    - `name` `string` name of cookie
  - `clearCookie` `(name, options) => void`
    - `name` `string` name of cookie
    - `options` `[CookieOptions](https://expressjs.com/en/resources/middleware/cookie-session.html) | undefined` cookie options (like path, expires, etc.)
  - `attachment` `(filename) => void`
    - `filename` `string` name of file in 'Content-Disposition' header
  - `log` `(logger) => Partial<LoggerTokens>` logger function [read](#logger)
    - `logger` `Logger | undefined` logger options

#### Logger

You can log requests and responses using `log` function in any [interceptor](#interceptors).

`log` has the following signature `(logger?: Logger) => Partial<LoggerTokens>`.

`logger` parameter has the following optional properties

- `options?` `LoggerOptions` object map containing tokens to log. Keys is token names, values is boolean. `true` will add token into log, `false` will remove. If `options` property is not passed, following tokens will be logged
  - Request
    - type
    - id
    - timestamp
    - method
    - url
  - Response
    - type
    - id
    - timestamp
    - method
    - url
    - statusCode
    - data
- `rewrite?` `(tokens: Partial<LoggerTokens>) => void` function to replace default `console.dir(tokens, { depth: null })` appearance

`log` function returns object with logged token values

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/posts',
        method: 'get',
        routes: [
          {
            interceptors: {
              request: ({ log }) => {
                log({
                  // logs following object in terminal
                  options: {
                    // {
                    id: true, //  id: 1,
                    type: true, //  type: 'request',
                    timestamp: true, //  timestamp: '31.12.2024, 23:59:59,999',
                    method: true, //  method: 'GET',
                    url: true //  url: 'http://localhost:31299/api/rest/posts/1'
                  } // }
                });
              },
              response: (data, { log }) => {
                log({
                  // logs following string in terminal
                  options: {
                    // response get: http://localhost:31299/api/rest/posts/1 => 200
                    type: true,
                    statusCode: true,
                    method: true,
                    url: true
                  },
                  rewrite: ({ type, statusCode, method, url }) => {
                    console.info(`${type} ${method}: ${url} => ${statusCode}`);
                  }
                });
                return data;
              }
            }
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

> By default, `timestamp` and `method` tokens are prettified.
> Timestamp transforms from UNIX-timestamp number to `DD.MM.YYYY, HH:mm:ss,sss` string.
> Method transforms from lower case to upper case.
> If `rewrite` function is used, those tokens will remain unformatted. You can format them as you need.

##### Logger tokens

- `type?` `'request' | 'response'` type of log
- `id?` `number` unique id of request to reference request log with response log
- `timestamp?` `number` UNIX-timestamp in milliseconds
- `method?` `'get' | 'post' | 'delete' | 'put' | 'patch' | 'options'` HTTP method
- `url?` `string` requested URL
- `graphQLOperationType?` `'query' | 'mutation' | null` GraphQL operation type. `null` if request is not GraphQL
- `graphQLOperationName?` `string` GraphQL operation name. `null` if request is not GraphQL
- `graphQLQuery?` `string` GraphQL query. `null` if request is not GraphQL
- `variables?`: `Record<string, any>` GraphQL variables. `null` if request is not GraphQL or variables is not passed
- `headers?` `Record<string, any>` headers object
- `cookies?` `Record<string, any>` cookies object
- `query?` `Record<string, any>` query object
- `params?` `Record<string, any>` params object
- `body?` `any` body

Response logger has additional tokens

- `statusCode?` `number` response status code
- `data?` `any` data returned to client

If you need to log specific properties in mapped entities (headers, cookies, query, params), use `Record<string, boolean>` object instead of boolean.
In that case logger will use following logic:

- if some token is `true`, entity will be filtered by `whitelist` logic. _Only_ enabled ones will be logged.
- if all tokens is `false`, entity will be filtered by `blacklist` logic. All entities will be logged _except_ disabled ones.

> Whitelist logic have priority over blacklist if you pass `true` and `false` in same entity.

```javascript
/** @type {import('mock-config-server').FlatMockServerConfig} */
const flatMockServerConfig = [
  {
    baseUrl: '/api'
  },
  {
    configs: [
      {
        path: '/posts',
        method: 'get',
        routes: [
          {
            interceptors: {
              request: ({ log }) => {
                log({
                  // whitelist. only query1 and query2 will be logged
                  options: {
                    query: {
                      query1: true,
                      query2: true
                    }
                  }
                });
                log({
                  // whitelist. only cookie1 and cookie2 will be logged
                  options: {
                    cookies: {
                      cookie1: true,
                      cookie2: true,
                      cookie3: false
                    }
                  }
                });
                log({
                  // blacklist. all headers will be logged except header1
                  options: {
                    headers: {
                      header1: false
                    }
                  }
                });
              }
            },
            data: {}
          }
        ]
      }
    ]
  }
];

export default flatMockServerConfig;
```

## Database

With `mock-config-server` you can create your own mock database with all CRUD operations

- `data` `Object | string` initial data for database
- `routes?` `Object | string` map of custom routes for database

### Basic example

```javascript
const flatMockServerConfig = [
  {
    database: {
      data: {
        users: [{ id: 1, name: 'John' }],
        settings: {
          blocked: false
        }
      }
    }
  }
];
```

Now you have the following routes for requests

#### Collection routes

```
GET    /users
POST   /users
GET    /users/1
PUT    /users/1
PATCH  /users/1
DELETE /users/1
```

#### Single routes

```
GET   /settings
POST  /settings
PUT   /settings
PATCH /settings
```

> Collection routes created from arrays which all elements have **unique**(!) id. Other database parts become single routes.

Also, there are additional routes: `/__db` and `/__routes`

```
__db -> return data from database config
__routes -> return routes from database config
```

### Routes example

```javascript
const flatMockServerConfig = [
  {
    database: {
      data: {
        users: [{ id: 1, name: 'John' }],
        settings: {
          blocked: false
        }
      },
      routes: {
        '/api/users/:id': '/users/:id',
        '/*/my-settings': '/settings'
      }
    }
  }
];
```

Now following routes will work correctly

```
/api/users/1 -> return data for /users/1
/some/custom/url/my-settings -> return data for /settings
```

Note some things:

- String routes should start with forward slash
- If you want to use id param in route then use only `:id` template
- You can use `wildcard` only for custom route, **not for real route**

### Filter

> Use . to access deep properties

```
GET /users?name=siberiacancode
GET /users?id=1&id=2
GET /users?author.name=siberiacancode
```

### Pagination

> Use \_page and optionally \_limit to paginate returned data.

```
GET /users?_page=1
GET /users?_page=1&_limit=5
```

> **\_limit** is 10 by default

The returned data has the format:

```
{
  _link: Link,
  results: Data[]
}
```

In the **Link** header you'll get **count**, **pages**, **next** and **prev** links.

#### Link

- `count` `number` total count of elements
- `pages` `number` count of pages
- `next` `string | null` query string for next link
- `prev` `string | null` query string for prev link

### Sort

> Use \_sort and \_order, use . to access deep properties

```
GET /users?_sort=name
GET /users/1/transfers?_sort=id&_order=asc
GET /users?_sort=address.city&_order=desc
```

> **\_order** is 'asc' by default

For multiple fields:

```
GET /users?_sort=id&_order=desc&_sort=name&_order=asc
```

### Slice

> X-Total-Count header is included in the response

```
GET /users?_begin=20
GET /users?_begin=20&_end=30
```

Works exactly as [slice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice), \_begin and \_end are optional

### Full text search

> Add \_q parameter for search data, search can be done by strings and numbers

```
GET /users?_q=siberia
```

For multiple search

```
GET /users?_q=siberia&_q=24
```

### File example

```javascript
const flatMockServerConfig = [
  {
    database: {
      data: './data.json',
      routes: './routes.json'
    }
  }
];
```

Instead of objects you can use paths to **JSON** files which contain needed data or routes

## CLI usage

```
mcs [options]

Options:
  --baseUrl, -b         Set base url (default: '/')
  --port, -p            Set port (default: 31299)
  --staticPath, -s      Set static path
  --config, -c          Set path to config file (default: './mock-server.config.(?:ts|mts|cts|js|mjs|cjs)')
  --watch, -w           Enables server restart after config file changes (default: false)

  --version, -v         Show version number
  --help, -h            Show help

Examples:
  mcs --baseurl /base/url --port 3000 --config ./path/to/config.ts -w
  mcs --help
```

## Init Command

The init command is used to initialize a new project or set up the initial configuration for a tool. It helps users get started with a new project by providing a streamlined setup process.

```
mcs init

Examples:
  mcs init
  mcs init --baseurl /base/url --port 3000
```

## ✨ Contributors

<table>
<tr>
    <td align="center" style="word-wrap: break-word; width: 100.0; height: 100.0">
        <a href="https://github.com/debabin">
            <img src="https://avatars.githubusercontent.com/u/45297354?v=4"
            width="100;"  
            alt="debabin" />
            <br />
            <sub style="font-size:13px"><b>☄️ debabin</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 100.0; height: 100.0">
        <a href="https://github.com/MiaInturi">
            <img src="https://avatars.githubusercontent.com/u/39031929?v=4"
            width="100;"  
            alt="MiaInturi" />
            <br />
            <sub style="font-size:13px"><b>👹 MiaInturi</b></sub>
        </a>
    </td>
      <td align="center" style="word-wrap: break-word; width: 100.0; height: 100.0">
        <a href="https://github.com/RiceWithMeat">
            <img src="https://avatars.githubusercontent.com/u/47690223?v=4"
            width="100;"  
            alt="RiceWithMeat" />
            <br />
            <sub style="font-size:13px"><b>🐘 RiceWithMeat</b></sub>
        </a>
    </td>
    <td align="center" style="word-wrap: break-word; width: 100.0; height: 100.0">
        <a href="https://github.com/anv296">
            <img src="https://avatars.githubusercontent.com/u/39154399?s=400&u=7c4fcc6d120f4b13ccbd03a9a384622b6523c376&v=4"
            width="100;"  
            alt="anv296" />
            <br />
            <sub style="font-size:13px"><b>🎱️ anv296</b></sub>
        </a>
    </td>
        <td align="center" style="word-wrap: break-word; width: 100.0; height: 100.0">
        <a href="https://github.com/kvelian">
            <img src="https://avatars.githubusercontent.com/u/81089091?s=400&u=7c4fcc6d120f4b13ccbd03a9a384622b6523c376&v=4"
            width="100;"  
            alt="kvelian" />
            <br />
            <sub style="font-size:13px"><b>🌵 kvelian</b></sub>
        </a>
    </td>
  </tr>
</table>
