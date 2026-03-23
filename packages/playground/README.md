# Mock Config Playground

Standalone **JSON database** mock server: full CRUD over REST, same database model as [**mock-config-server**](https://www.npmjs.com/package/mock-config-server) but without REST/GraphQL route configs — only `data` + optional `routes`, CORS, static files, and interceptors.

## Install

```bash
npm i mock-config-playground --save-dev
# or
pnpm add -D mock-config-playground
```

## Philosophy

Use a single JSON file as the database, run a small Express server, and iterate on frontend or tools against predictable REST endpoints (`GET /collection`, `POST /collection`, nested resources, filters, pagination, etc.). For the full mock stack (REST + GraphQL + flat configs), use **mock-config-server**.

## Features

- **TypeScript-first** — types exported from the package
- **Database REST API** — collections, singletons, `/__db`, `/__routes`, filters, sort, pagination (see [Database](#database))
- **CORS** — optional, same shape as mock-config-server
- **Static files** — optional `staticPath`
- **Request interceptors** — optional server-level request interceptor

## CLI

The binary is **`mock-config-playground`** (short: **`mcp`**).

```text
mock-config-playground playground <data> [options]
```

| Option | Alias | Description |
|--------|-------|-------------|
| `--baseUrl` | `-b` | URL prefix for the app (default `/`) |
| `--port` | `-p` | Port (default from shared constants, same family as mock-config-server) |
| `--staticPath` | `-s` | Static files path |

`<data>` must be a path to a **JSON file** whose root value is a **plain object** (validated before start).

### Examples

```bash
npx mock-config-playground playground ./db.json --port 4000 --baseUrl /api
npx mock-config-playground playground ./db.json -b / -p 31299
```

## Database

Behavior matches the **Database** section of [mock-config-server README](../server/README.md#database): collections vs single routes, custom `routes` map, `/__db`, `/__routes`, filter / pagination / sort / search query params.

Minimal example — `db.json`:

```json
{
  "users": [{ "id": 1, "name": "John" }],
  "settings": { "blocked": false }
}
```

Typical routes:

```text
GET    /users
POST   /users
GET    /users/1
PUT    /users/1
PATCH  /users/1
DELETE /users/1
GET    /settings
...
```

You can also point `data` / `routes` at JSON **file paths** inside the config when using the programmatic API (see types `DatabaseMockServerConfig`).

## Embed (programmatic API)

Import **`startPlaygroundServer`** to listen, or **`createPlaygroundServer`** if you mount the app yourself (tests, custom Express).

```typescript
import {
  createPlaygroundServer,
  startPlaygroundServer
} from 'mock-config-playground';
import type { DatabaseMockServerConfig } from 'mock-config-playground';

const config: DatabaseMockServerConfig = {
  port: 31299,
  baseUrl: '/',
  data: {
    posts: [{ id: 1, title: 'Hello' }]
  }
};

// Listens on config.port; returns http.Server with extra `destroy()` for clean shutdown
const server = startPlaygroundServer(config);

// Later (e.g. tests, watch mode):
server.destroy(() => process.exit(0));

// Or only build the Express app:
const app = createPlaygroundServer({ ...config, data: config.data });
```

`startPlaygroundServer` wraps the Node HTTP server with **`destroy()`** so open keep-alive connections do not block shutdown — use it before restarting or exiting the process.

## See also

- Full mock server (REST, GraphQL, flat config, CLI `mcs`): [mock-config-server](../server/README.md)
