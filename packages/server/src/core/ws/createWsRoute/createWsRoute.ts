import type { IncomingMessage } from 'node:http';
import type { RawData, WebSocketServer } from 'ws';

import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';

import type { Entries, WsFrame, WsParams, WsRequestArtifact } from '@/utils/types';

import { isComparator, parseCookie, parseQuery, resolveEntityValues, sleep } from '@/utils/helpers';

import { equals } from '../../entities';

interface CreateWsRouteParams {
  server: WebSocketServer;
  wsRequestArtifacts: WsRequestArtifact[];
}

const sendWsData = (socket: WebSocket, data: unknown) => {
  if (data === undefined) return;
  if (typeof data === 'string') {
    socket.send(data);
    return;
  }

  const isBinary =
    data instanceof ArrayBuffer ||
    ArrayBuffer.isView(data) ||
    data instanceof Blob ||
    Buffer.isBuffer(data);
  if (isBinary) {
    socket.send(data);
    return;
  }

  socket.send(JSON.stringify(data));
};

const broadcastWsData = (server: WebSocketServer, data: unknown) => {
  if (data === undefined) return;
  for (const client of server.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    sendWsData(client, data);
  }
};

export const createWsRoute = ({ server, wsRequestArtifacts }: CreateWsRouteParams) => {
  server.on(
    'connection',
    async (
      socket,
      request: IncomingMessage & {
        queries: Record<string, string | string[]>;
        cookies: Record<string, string>;
      }
    ) => {
      const [requestPathname] = request.url!.split('?');
      const matchedRequestArtifacts = wsRequestArtifacts.filter((artifact) => {
        if (artifact.baseUrl === '/') return true;
        return (
          requestPathname === artifact.baseUrl || requestPathname.startsWith(`${artifact.baseUrl}/`)
        );
      });

      const connectionArtifacts = matchedRequestArtifacts.filter(
        (artifact) => artifact.type === 'connection'
      );
      const rawArtifacts = matchedRequestArtifacts.filter((artifact) => artifact.type === 'raw');

      request.queries = parseQuery(request.url ?? '');
      request.cookies = parseCookie(request.headers.cookie ?? '');

      for (const artifact of connectionArtifacts) {
        if (artifact.config.entities) {
          const entityEntries = Object.entries(artifact.config.entities) as Entries<
            Required<typeof artifact.config.entities>
          >;

          const isMatchedByEntities = entityEntries.every(([entityName, valueOrComparator]) => {
            const actualEntity = request[entityName];

            if (isComparator(valueOrComparator)) {
              const comparator = valueOrComparator;
              return resolveEntityValues({ actual: actualEntity, comparator });
            }

            const mappedEntityEntries = Object.entries(valueOrComparator);
            return mappedEntityEntries.every(([entityPropertyKey, valueOrComparator]) => {
              // ✅ important:
              // transform header keys to lower case
              // because browsers send headers in lowercase
              const actualPropertyKey =
                entityName === 'headers' && typeof entityPropertyKey === 'string'
                  ? entityPropertyKey.toLowerCase()
                  : entityPropertyKey;
              const actualPropertyValue = actualEntity[actualPropertyKey];

              const comparator = isComparator(valueOrComparator)
                ? valueOrComparator
                : equals(valueOrComparator);

              return resolveEntityValues({
                actual: actualPropertyValue,
                comparator
              });
            });
          });

          if (!isMatchedByEntities) continue;
        }

        const params = {
          broadcast: (data: unknown) => broadcastWsData(server, data),
          request,
          socket,
          send: (data: unknown) => sendWsData(socket, data),
          setDelay: async (delay: number) => {
            await sleep(delay === Infinity ? 99999999 : delay);
          }
        };

        const resolvedData = await artifact.config.data(params);

        sendWsData(socket, resolvedData);
      }

      socket.on('message', async (raw: RawData, isBinary: boolean) => {
        const frame: WsFrame = isBinary
          ? { isBinary: true, raw: raw as Buffer }
          : { isBinary: false, raw: raw.toString() };

        const params: WsParams = {
          ...frame,
          broadcast: (data: unknown) => broadcastWsData(server, data),
          socket,
          send: (data: unknown) => sendWsData(socket, data),
          setDelay: async (delay) => {
            await sleep(delay === Infinity ? 99999999 : delay);
          }
        };

        for (const artifact of rawArtifacts) {
          if (artifact.componentRequestInterceptor) {
            await artifact.componentRequestInterceptor(params);
          }

          const resolvedData = await artifact.config.data(params);

          const data = artifact.componentResponseInterceptor
            ? artifact.componentResponseInterceptor(resolvedData, params)
            : resolvedData;

          sendWsData(socket, data);
        }
      });
    }
  );
};
