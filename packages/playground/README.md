# Mock Config Playground

`mock-config-playground` is a standalone package for running a JSON database mock server with REST CRUD routes.

## Install

```bash
npm i mock-config-playground --save-dev
```

## Philosophy

`mock-config-playground` is an independent package for quick local mocking around a single JSON database model:

- start fast from one file (`db.json`) or one in-memory object
- keep routes predictable and close to real CRUD behavior
- use it as a lightweight dev/test backend for frontend, SDK, and integration scenarios

If you need advanced route configuration, use the full [`mock-config-server`](../server/README.md).

## Usage

You can run playground in two ways:

1. **CLI**
2. **Programmatic server**

## Usage

Binary:

- `mock-playground`
- short alias: `mp`

```text
mock-playground <data> [options]
```

| Option         | Alias | Description                             |
| -------------- | ----- | --------------------------------------- |
| `--baseUrl`    | `-b`  | URL prefix for all routes (default `/`) |
| `--port`       | `-p`  | HTTP port (default: `7777`)             |
| `--staticPath` | `-s`  | Path to static files                    |

`<data>` is a path to a JSON file.

### CLI examples

```bash
npx mock-config-playground ./db.json --port 3000 --baseUrl /api
```

Use `startPlaygroundServer` to listen immediately, or `createPlaygroundServer` to get an server app.

```typescript
import type { PlaygroundServerConfig } from "mock-config-playground";

import {
  createPlaygroundServer,
  startPlaygroundServer,
} from "mock-config-playground";

const config: PlaygroundServerConfig = {
  port: 3000,
  baseUrl: "/",
  data: {
    posts: [{ id: 1, title: "Hello" }],
  },
};

const server = startPlaygroundServer(config);
// or
const app = createPlaygroundServer(config);
```

## Database

Minimal `db.json` example:

```json
{
  "users": [{ "id": 1, "name": "John" }],
  "settings": { "blocked": false }
}
```

### Generated routes

Collections:

```text
GET    /users
POST   /users
GET    /users/1
PUT    /users/1
PATCH  /users/1
DELETE /users/1
```

Singletons:

```text
GET   /settings
POST  /settings
PUT   /settings
PATCH /settings
```

Additional routes:

```text
GET /__db
GET /__routes
```

You can provide `data` and `routes` as objects or as JSON file paths via programmatic config.

## Routes override (custom aliases)

You can remap incoming URLs to real database routes with `routes`.

```typescript
import type { PlaygroundServerConfig } from "mock-config-playground";

const config: PlaygroundServerConfig = {
  data: {
    users: [{ id: 1, name: "John" }],
    settings: { blocked: false },
  },
  routes: {
    "/api/users/:id": "/users/:id",
    "/*/my-settings": "/settings",
  },
};
```

Now aliases resolve correctly:

```text
GET /api/users/1 -> /users/1
GET /v1/my-settings -> /settings
```

Notes:

- custom route keys should start with `/`
- use `:id` placeholder for id mapping
- wildcard `*` can be used only on custom route key

## Query parameters

All examples below are supported for collection endpoints.

### Filter

```text
GET /users?name=John
GET /users?id=1&id=2
GET /users?author.name=alice
```

### Pagination (`_page`, `_limit`)

```text
GET /users?_page=1
GET /users?_page=1&_limit=5
```

Notes:

- `_limit` default is `10`
- response format:

```json
{
  "_link": {
    "count": 25,
    "pages": 5,
    "next": "?_page=2&_limit=5",
    "prev": null
  },
  "results": []
}
```

### Sort (`_sort`, `_order`)

```text
GET /users?_sort=name
GET /users?_sort=address.city&_order=desc
GET /users?_sort=id&_order=desc&_sort=name&_order=asc
```

`_order` default is `asc`.

### Slice (`_begin`, `_end`)

```text
GET /users?_begin=20
GET /users?_begin=20&_end=30
```

Works like JavaScript `Array.prototype.slice`. `X-Total-Count` header is included in response.

### Full-text search (`_q`)

```text
GET /users?_q=john
GET /users?_q=john&_q=24
```

Search applies to string and number values.

### Embed related resources (`_embed`)

Use `_embed` to include related entities into response items.

```text
GET /posts/1?_embed=user
GET /posts?_embed=user
GET /posts?_embed=user&_embed=users
```

Typical relation examples:

- `posts.userId -> users.id` adds `user` object
- `posts.usersIds -> users.id` adds `users` array
