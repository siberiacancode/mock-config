import type { IncomingMessage } from 'node:http';
import type { RawData, WebSocketServer } from 'ws';

import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';

import type {
  Entries,
  GraphQLSubscriptionParams,
  WsFrame,
  WsParams,
  WsRequestArtifact
} from '@/utils/types';

import {
  getGraphQLSubscriptionInput,
  isComparator,
  parseCookie,
  parseGraphQLQuery,
  parseQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { equals } from '../../entities';
import { matchGraphQLSubscriptionRequestArtifacts, matchRawRequestArtifacts } from './helpers';

interface CreateWsRouteParams {
  server: WebSocketServer;
  wsRequestArtifacts: WsRequestArtifact[];
}

const sendGraphQLSubscriptionData = (socket: WebSocket, data: unknown) => {
  if (data === undefined) return;
  socket.send(typeof data === 'string' ? data : JSON.stringify(data));
};

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

      request.queries = parseQuery(request.url!);
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
                entityName === 'headers' ? entityPropertyKey.toLowerCase() : entityPropertyKey;
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

        const messageWsRequestArtifacts = wsRequestArtifacts.filter(
          (artifact) => artifact.type !== 'connection'
        );

        for (const artifact of messageWsRequestArtifacts) {
          if (artifact.type === 'graphql-ws') {
            if (frame.isBinary) continue;

            let payload: Record<string, unknown> = {};
            try {
              payload = JSON.parse(raw.toString()) as Record<string, unknown>;
            } catch {
              continue;
            }
            const graphQLInput = getGraphQLSubscriptionInput(payload);

            if (!graphQLInput.query) continue;
            const query = parseGraphQLQuery(graphQLInput.query);
            if (!query || query.operationType !== 'subscription') continue;

            const matchedRequestArtifacts = matchGraphQLSubscriptionRequestArtifacts({
              artifact,
              meta: {
                path: requestPathname,
                query: graphQLInput.query,
                operationType: query.operationType,
                operationName: query.operationName
              }
            });
            if (!matchedRequestArtifacts) continue;

            const entities = artifact.config.entities;
            if (entities) {
              const entityEntries = Object.entries(entities) as Entries<Required<typeof entities>>;

              const isMatchedByEntities = entityEntries.every(([_, valueOrComparator]) => {
                const actualEntity = graphQLInput.variables;

                if (isComparator(valueOrComparator)) {
                  const comparator = valueOrComparator;
                  return resolveEntityValues({ actual: actualEntity, comparator });
                }

                const comparator = equals(valueOrComparator);
                return resolveEntityValues({ actual: actualEntity, comparator });
              });

              if (!isMatchedByEntities) continue;
            }

            const params: GraphQLSubscriptionParams = {
              entities: artifact.config.entities ?? {},
              next: (payloadToSend) => {
                sendGraphQLSubscriptionData(socket, payloadToSend);
              },
              operationName: query.operationName!,
              query: graphQLInput.query,
              raw,
              setDelay: async (delay) => {
                await sleep(delay === Infinity ? 99999999 : delay);
              },
              socket,
              variables: graphQLInput.variables
            };

            const resolvedData =
              typeof artifact.config.data === 'function'
                ? await artifact.config.data(params)
                : artifact.config.data;

            if (artifact.config.settings?.delay) {
              await sleep(artifact.config.settings.delay);
            }

            sendGraphQLSubscriptionData(socket, resolvedData);
            return;
          }

          if (artifact.type === 'raw') {
            const matchedRawArtifacts = matchRawRequestArtifacts({
              artifact,
              meta: {
                path: requestPathname
              }
            });
            if (!matchedRawArtifacts) continue;

            if (artifact.componentRequestInterceptor) {
              await artifact.componentRequestInterceptor(params);
            }

            const resolvedData = await artifact.config.data(params);

            const data = artifact.componentResponseInterceptor
              ? artifact.componentResponseInterceptor(resolvedData, params)
              : resolvedData;

            if (artifact.config.settings?.delay) {
              await sleep(artifact.config.settings.delay);
            }

            sendWsData(socket, data);
            return;
          }

          console.warn(`Unsupported artifact type`);
        }
      });
    }
  );
};
