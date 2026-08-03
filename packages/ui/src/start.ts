import type { H3Event } from 'h3';

import color from 'ansi-colors';
import { getPort } from 'get-port-please';
import { createApp, eventHandler, readBody, serveStatic, toNodeListener } from 'h3';
import { lookup } from 'mrmime';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import open from 'open';

import type { MockServerInspectorArgv } from './types';

import { parseSseFrames } from './helpers/sse';
import { stringify } from './helpers/stringify';
import { createConfigWatcher } from './watch';
import { createWsServer } from './ws';

const BUILD_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');

const MOCK_SERVER_DEFAULT_PORT = 31299;

const getMockServerSettings = (mockConfig: any) => {
  const [option] = mockConfig ?? [];
  return option && !('configs' in option) ? option : {};
};

const getMockServerPort = (mockConfig: any) => {
  const { port } = getMockServerSettings(mockConfig);
  return typeof port === 'number' ? port : MOCK_SERVER_DEFAULT_PORT;
};

const joinPath = (...parts: unknown[]) =>
  `/${parts
    .flatMap((part) => String(part ?? '').split('/'))
    .filter(Boolean)
    .join('/')}`;

const REQUEST_TIMEOUT_MS = 10_000;
const EVENT_STREAM_TYPE = 'text/event-stream';

const streamEvents = async (event: H3Event, response: Response, elapsedMs: () => number) => {
  const writeLine = (line: unknown) => {
    if (event.node.res.writableEnded || event.node.res.destroyed) return;
    event.node.res.write(`${JSON.stringify(line)}\n`);
  };

  event.node.res.setHeader('Content-Type', 'application/x-ndjson');
  event.node.res.setHeader('Cache-Control', 'no-cache');
  event.node.res.flushHeaders();

  writeLine({
    kind: 'meta',
    status: response.status,
    statusText: response.statusText,
    durationMs: elapsedMs(),
    headers: Object.fromEntries(response.headers.entries())
  });

  const reader = response.body?.getReader();
  if (!reader) {
    writeLine({ kind: 'end' });
    return event.node.res.end();
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseFrames(buffer);
      buffer = rest;

      events.forEach((sseEvent) => writeLine({ kind: 'event', ...sseEvent, atMs: elapsedMs() }));
    }

    writeLine({ kind: 'end' });
  } catch (error) {
    writeLine({ kind: 'error', error: error instanceof Error ? error.message : 'Stream failed' });
  }

  return event.node.res.end();
};

const resolveMockServerUrl = (mockConfig: any, requestPath: string) => {
  const { baseUrl } = getMockServerSettings(mockConfig);
  const [pathname, search] = requestPath.split('?');

  return `http://127.0.0.1:${getMockServerPort(mockConfig)}${joinPath(baseUrl, pathname)}${search ? `?${search}` : ''}`;
};

export const start = async (argv: MockServerInspectorArgv) => {
  const host = argv.host ?? '127.0.0.1';
  const port = await getPort({ port: argv.port, portRange: [7777, 9000], host });

  const app = createApp();

  const ws = await createWsServer();

  const watcher = await createConfigWatcher(argv, (mockConfig) =>
    ws.send(
      JSON.stringify({
        type: 'config-updated',
        payload: { ws: ws.getData(), config: stringify(mockConfig) }
      })
    )
  );

  app.use(
    '/api/status',
    eventHandler(async (event) => {
      const mockServerPort = getMockServerPort(watcher.getConfig());

      let mockServer = false;
      try {
        await fetch(`http://127.0.0.1:${mockServerPort}/`, { signal: AbortSignal.timeout(1000) });
        mockServer = true;
      } catch {
        mockServer = false;
      }

      event.node.res.setHeader('Content-Type', 'application/json');
      return event.node.res.end(JSON.stringify({ mockServer, port: mockServerPort }));
    })
  );

  app.use(
    '/api/payload',
    eventHandler(async (event) => {
      event.node.res.setHeader('Content-Type', 'application/json');
      return event.node.res.end(
        JSON.stringify({ ws: ws.getData(), config: stringify(watcher.getConfig()) })
      );
    })
  );

  app.use(
    '/api/config',
    eventHandler(async (event) => {
      event.node.res.setHeader('Content-Type', 'application/json');
      return event.node.res.end(JSON.stringify(stringify(watcher.getConfig())));
    })
  );

  // requests from the ui are replayed through the inspector instead of being sent by the browser:
  // Cookie is a forbidden request-header, so fetch drops it without an error and routes matched by
  // cookies would resolve to the wrong one:
  // MDN - https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header
  // Spec - https://fetch.spec.whatwg.org/#forbidden-request-header
  // the mock server cors settings may also exclude the inspector origin
  app.use(
    '/api/request',
    eventHandler(async (event) => {
      const {
        method = 'get',
        path: requestPath,
        headers = {},
        body
      } = (await readBody(event)) ?? {};

      event.node.res.setHeader('Content-Type', 'application/json');

      if (typeof requestPath !== 'string' || !requestPath.startsWith('/')) {
        event.node.res.statusCode = 400;
        return event.node.res.end(JSON.stringify({ error: 'path must start with "/"' }));
      }

      const startedAt = performance.now();
      const elapsedMs = () => Math.round(performance.now() - startedAt);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      event.node.res.on('close', () => {
        if (!event.node.res.writableEnded) controller.abort();
      });

      try {
        const response = await fetch(resolveMockServerUrl(watcher.getConfig(), requestPath), {
          method: String(method).toUpperCase(),
          headers,
          ...(body !== undefined && { body }),
          signal: controller.signal
        });
        const responseHeaders = Object.fromEntries(response.headers.entries());
        const isStream = (responseHeaders['content-type'] ?? '').includes(EVENT_STREAM_TYPE);

        if (!isStream) {
          const responseBody = await response.text();
          clearTimeout(timeout);

          return event.node.res.end(
            JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              durationMs: elapsedMs(),
              headers: responseHeaders,
              body: responseBody
            })
          );
        }

        clearTimeout(timeout);
        return streamEvents(event, response, elapsedMs);
      } catch (error) {
        clearTimeout(timeout);
        if (event.node.res.headersSent) return event.node.res.end();

        event.node.res.statusCode = 502;
        return event.node.res.end(
          JSON.stringify({ error: error instanceof Error ? error.message : 'Request failed' })
        );
      }
    })
  );

  const resolveBuildFilePath = (file: string) => {
    const filePath = path.join(BUILD_PATH, file);
    const isInsideBuild = filePath.startsWith(BUILD_PATH + path.sep);

    if (!isInsideBuild || !path.extname(file)) return path.join(BUILD_PATH, 'index.html');
    return filePath;
  };

  app.use(
    '/',
    eventHandler((event) =>
      serveStatic(event, {
        getContents: (file) => readFile(resolveBuildFilePath(file)),
        getMeta: async (file) => {
          const filePath = resolveBuildFilePath(file);
          const stats = await stat(filePath).catch(() => undefined);

          if (!stats || !stats.isFile()) {
            return;
          }

          return {
            type: lookup(filePath),
            size: stats.size,
            mtime: stats.mtimeMs
          };
        }
      })
    )
  );

  const server = createServer(toNodeListener(app));

  server.listen(port, host, async () => {
    const url = `http://${host === '127.0.0.1' ? 'localhost' : host}:${port}`;
    if (argv.open) await open(url);

    console.log(color.blue('ℹ'), `Starting mock config inspector at`, color.green(url), '\n');
  });
};
