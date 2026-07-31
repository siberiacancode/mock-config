<div align="center">
  <a href="https://siberiacancode.github.io/mock-config">
    <picture>
      <img alt="Mock Config logo" src="https://siberiacancode.github.io/mock-config/logo/logo-light.svg" height="128">
    </picture>
  </a>
  <h1>Mock Config Server</h1>

<a href="https://www.npmjs.com/package/mock-config-server"><img alt="NPM version" src="https://img.shields.io/npm/v/mock-config-server.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/siberiacancode/mock-config-server/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/npm/l/mock-config-server.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/siberiacancode/mock-config-server/discussions"><img alt="Join the community on GitHub" src="https://img.shields.io/badge/Join%20the%20community-blueviolet.svg?style=for-the-badge&logo=GitHub&labelColor=000000&logoWidth=20"></a>

</div>

**Mock Config Server** is a small tool to spin up a fake API from config: REST routes, GraphQL, and WebSockets. **Less code, more mock:** keep declarations small and put the payoff in the mocked behavior you get at the end.

## Documentation

Visit the [mock-config documentation](https://siberiacancode.github.io/mock-config/docs/introduction/what-is-mock-config-server) for broader docs and examples.

## Getting Started

```bash
npm install mock-config-server --save-dev
```

Create `mock-server.config.(js|ts)` next to your project root, then run:

```bash
npx mock-config-server
# or
npx mcs
```

```ts
import { graphql, mock, rest, ws } from 'mock-config-server';

export default mock(
  { baseUrl: '/api' },
  {
    name: 'rest',
    configs: [
      rest.get('/users', [{ emoji: '🧊', name: 'siberiacancode' }]),
      rest.get<{ response: { emoji: string; id: number; name: string }; params: { id: string } }>(
        '/user/:id',
        {
          id: 1,
          emoji: '🧊',
          name: 'siberiacancode'
        },
        {
          match: {
            params: {
              id: '1'
            }
          },
          delay: 1000
        }
      ),
      rest.get<{ response: { emoji: string; id: number; name: string }; params: { id: string } }>(
        '/user/:id',
        (params) => ({
          id: Number(params.request.params.id),
          emoji: '🧊',
          name: 'siberiacancode'
        })
      ),
      rest.sse('/stream', ({ client }) => {
        client.send('hello');
        client.close();
      })
    ]
  },
  {
    name: 'graphql',
    baseUrl: '/graphql',
    configs: [
      graphql.query('GetUsers', {
        data: {
          users: [{ emoji: '🧊', name: 'siberiacancode' }]
        }
      })
    ]
  },
  {
    name: 'ws',
    baseUrl: '/ws',
    configs: [
      ws.connection(() => ({ success: true, message: 'We are happy to see you!' })),
      ws.message(async (params) => {
        await params.setDelay(1000);
        params.send({ payload: 'Hello, world!' });
      })
    ]
  },
  {
    name: 'graphql-subscription',
    baseUrl: '/graphql-subscription',
    configs: [
      graphql.subscription('GetUsers', {
        data: {
          users: [{ emoji: '🧊', name: 'siberiacancode' }]
        }
      })
    ]
  }
);
```

## API

We aim to support all essential APIs for mocking.

- `rest.get`, `rest.post`, `rest.put`, `rest.patch`, `rest.delete`, `rest.options`, `rest.sse`, `rest.stream`
- `graphql.query`, `graphql.mutation`, `graphql.subscription`
- `ws.connection`, `ws.message`

## CLI installation

Use the CLI to scaffold a starter `mock-server.config` and `mock-requests` folder with `mock-config-server`.

```bash
npx mock-config-server@latest init
# or
npx mcs init
```

You will be prompted for a few choices:

```text
? Would you like to use TypeScript? › Yes / No
? Choose API type › REST · GraphQL · Both (REST + GraphQL)
? Base URL (must start with a forward slash): › /
? Port: › 31299
? Static path (must start with a forward slash): › /
```

After it finishes, start the mock server:

```bash
npx mcs
```
