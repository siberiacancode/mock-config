import color from 'ansi-colors';
import { getPort } from 'get-port-please';
import { createApp, eventHandler, serveStatic, toNodeListener } from 'h3';
import { lookup } from 'mrmime';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import open from 'open';

import type { MockServerInspectorArgv } from './types';

import { stringify } from './helpers/stringify';
import { createConfigWatcher } from './watch';
import { createWsServer } from './ws';

const BUILD_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build');

const MOCK_SERVER_DEFAULT_PORT = 31299;

const getMockServerPort = (mockConfig: any) => {
  const [option] = mockConfig ?? [];
  if (option && !('configs' in option) && typeof option.port === 'number') return option.port;
  return MOCK_SERVER_DEFAULT_PORT;
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
