# Mock Config Inspector

UI for inspecting a `mock-config-server` configuration: a local server serves the React app, watches `mock-server.config.*` and pushes changes to the UI over WebSocket.

## How to run

Install dependencies from the repo root first: `pnpm install`.

**Full dev cycle (recommended)** - one command:

```bash
pnpm dev            
```

Runs all dev processes in parallel in one terminal:

- **mock server** (`mcs --watch`) on the port from `mock-server.config.ts` - the thing being inspected
- **inspector backend** on a fixed dev port (7777) - reads `mock-server.config.ts`, restarts on changes to `src/`, `bin/` and the config
- **Vite dev server** with HMR - open its URL; `/api` requests are proxied to the inspector, so the app shows the real config. Config edits are pushed live over WebSocket
