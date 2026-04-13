import type { IncomingMessage } from 'node:http';
import type { RawData, WebSocketServer } from 'ws';

import { flatten } from 'flat';
import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';

import type { Entries, WsFrame, WsParams, WsRequestArtifact } from '@/utils/types';

import {
  convertToEntityDescriptor,
  parseCookie,
  parseQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

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

const emitWsData = (server: WebSocketServer, data: unknown) => {
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
        query: Record<string, string | string[]>;
        cookies: Record<string, string>;
      }
    ) => {
      const requestPath = (request.url ?? '/').split('?')[0] ?? '/';
      const matchedRequestArtifacts = wsRequestArtifacts.filter((artifact) => {
        if (requestPath === '/') return true;
        return requestPath === artifact.baseUrl || requestPath.startsWith(`${artifact.baseUrl}/`);
      });

      const connectionArtifacts = matchedRequestArtifacts.filter(
        (artifact) => artifact.type === 'connection'
      );
      const rawArtifacts = matchedRequestArtifacts.filter((artifact) => artifact.type === 'raw');

      request.query = parseQuery(request.url ?? '');
      request.cookies = parseCookie(request.headers.cookie ?? '');

      for (const artifact of connectionArtifacts) {
        if (artifact.config.entities) {
          const entityEntries = Object.entries(artifact.config.entities) as Entries<
            Required<typeof artifact.config.entities>
          >;

          const isMatchedByEntities = entityEntries.every(([entityName, entity]) => {
            const actualEntity = flatten<Record<string, unknown>, Record<string, unknown>>(
              request[entityName]
            );
            const entityValueEntries = Object.entries(entity) as Entries<typeof entity>;

            return entityValueEntries.every(
              ([entityPropertyKey, entityPropertyDescriptorOrValue]) => {
                const entityPropertyDescriptor = convertToEntityDescriptor(
                  entityPropertyDescriptorOrValue
                );

                const actualPropertyKey =
                  entityName === 'headers' ? entityPropertyKey.toLowerCase() : entityPropertyKey;
                const actualPropertyValue = actualEntity[actualPropertyKey];

                if (
                  entityPropertyDescriptor.checkMode === 'exists' ||
                  entityPropertyDescriptor.checkMode === 'notExists'
                ) {
                  return resolveEntityValues({
                    actualValue: actualPropertyValue,
                    checkMode: entityPropertyDescriptor.checkMode
                  });
                }

                return resolveEntityValues({
                  actualValue: actualPropertyValue,
                  descriptorValue: entityPropertyDescriptor.value,
                  checkMode: entityPropertyDescriptor.checkMode,
                  oneOf: entityPropertyDescriptor.oneOf ?? false
                });
              }
            );
          });

          if (!isMatchedByEntities) continue;
        }

        const params = {
          emit: (data: unknown) => emitWsData(server, data),
          request,
          socket,
          send: (data: unknown) => sendWsData(socket, data),
          setDelay: async (delay: number) => {
            await sleep(delay === Infinity ? 99999999 : delay);
          }
        };

        const resolvedData =
          typeof artifact.config.data === 'function'
            ? await artifact.config.data(params)
            : artifact.config.data;

        sendWsData(socket, resolvedData);
      }

      socket.on('message', async (raw: RawData, isBinary: boolean) => {
        const frame: WsFrame = isBinary
          ? { isBinary: true, raw: raw as Buffer }
          : { isBinary: false, raw: raw.toString() };

        const params: WsParams = {
          ...frame,
          emit: (data: unknown) => emitWsData(server, data),
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

          const resolvedData =
            typeof artifact.config.data === 'function'
              ? await artifact.config.data(params)
              : artifact.config.data;

          const data = artifact.componentResponseInterceptor
            ? artifact.componentResponseInterceptor(resolvedData, params)
            : resolvedData;

          sendWsData(socket, data);
        }
      });
    }
  );
};
