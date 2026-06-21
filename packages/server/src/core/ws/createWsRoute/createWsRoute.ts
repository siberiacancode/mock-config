import type { Express } from 'express';
import type { RawData, WebSocketServer } from 'ws';

import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';

import type {
  ConnectionWsRequestArtifact,
  Entries,
  GraphQLEntitiesByEntityName,
  GraphqlTransportWsExecutionResult,
  GraphqlTransportWsParams,
  GraphqlTransportWsRequestArtifact,
  RawWsRequestArtifact,
  WsConnectionParams,
  WsFrame,
  WsMessageParams,
  WsRequestArtifact
} from '@/utils/types';

import {
  callRequestInterceptors,
  callResponseInterceptors,
  getGraphqlTransportWsInput,
  isComparator,
  parseCookie,
  parseGraphQLQuery,
  parseQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { equals } from '../../entities';
import { matchGraphqlTransportWsRequestArtifacts, matchRawRequestArtifacts } from './helpers';

interface CreateWsRouteParams {
  server: WebSocketServer;
  wsRequestArtifacts: WsRequestArtifact[];
}

const sendGraphqlTransportWsData = (
  socket: WebSocket,
  id: string,
  payload: GraphqlTransportWsExecutionResult
) => {
  if (payload === undefined) return;
  socket.send(JSON.stringify({ id, type: 'next', payload }));
};

const sendGraphqlTransportWsComplete = (socket: WebSocket, id: string) => {
  socket.send(JSON.stringify({ id, type: 'complete' }));
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
      request: Express['request'] & {
        queries: Record<string, string | string[]>;
        cookies: Record<string, string>;
      }
    ) => {
      console.log('WS.OPEN', request.id, request.api);
      const completedSubscriptionIds = new Set<string>();

      const [requestPathname] = request.url!.split('?');
      const matchedRequestArtifacts = wsRequestArtifacts.filter((artifact) => {
        if (artifact.baseUrl === '/') return true;
        return (
          requestPathname === artifact.baseUrl || requestPathname.startsWith(`${artifact.baseUrl}/`)
        );
      });

      const { connectionArtifacts, graphqlTransportWsRequestArtifacts, rawWsRequestArtifacts } =
        matchedRequestArtifacts.reduce(
          (acc, artifact) => {
            if (artifact.type === 'connection') acc.connectionArtifacts.push(artifact);
            if (artifact.type === 'graphql-ws')
              acc.graphqlTransportWsRequestArtifacts.push(artifact);
            if (artifact.type === 'raw') acc.rawWsRequestArtifacts.push(artifact);

            return acc;
          },
          {
            connectionArtifacts: [] as ConnectionWsRequestArtifact[],
            graphqlTransportWsRequestArtifacts: [] as GraphqlTransportWsRequestArtifact[],
            rawWsRequestArtifacts: [] as RawWsRequestArtifact[]
          }
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
        console.log('artifact.componentInterceptors=', artifact.componentInterceptors);
        if (artifact.componentInterceptors) {
          await callRequestInterceptors({
            request,
            interceptors: artifact.componentInterceptors
          });
        }

        const params: WsConnectionParams = {
          broadcast: (data: unknown) => broadcastWsData(server, data),
          request,
          socket,
          send: (data: unknown) => sendWsData(socket, data),
          setDelay: async (delay: number) => {
            await sleep(delay);
          }
        };

        const resolvedData = await artifact.config.data(params);

        const data = await callResponseInterceptors({
          data: resolvedData,
          request,
          // @ts-ignore
          response: {},
          componentInterceptors: artifact.componentInterceptors,
          serverInterceptors: artifact.serverInterceptors
        });

        sendWsData(socket, data);
      }

      socket.on('message', async (raw: RawData, isBinary: boolean) => {
        console.log('WS.MESSAGE', request.id, request.api);
        const frame: WsFrame = isBinary
          ? { isBinary: true, raw: raw as Buffer }
          : { isBinary: false, raw: raw.toString() };
        const wsParams: WsMessageParams = {
          ...frame,
          broadcast: (data: unknown) => broadcastWsData(server, data),
          socket,
          send: (data: unknown) => sendWsData(socket, data),
          setDelay: async (delay) => {
            await sleep(delay);
          }
        };

        const matchedRawArtifacts = matchRawRequestArtifacts({
          artifacts: rawWsRequestArtifacts,
          meta: {
            path: requestPathname
          }
        });

        for (const artifact of matchedRawArtifacts) {
          if (artifact.componentInterceptors) {
            await callRequestInterceptors({
              request,
              interceptors: artifact.componentInterceptors
            });
          }

          const resolvedData = await artifact.config.data(wsParams);

          const data = await callResponseInterceptors({
            data: resolvedData,
            request,
            // @ts-ignore
            response: {},
            componentInterceptors: artifact.componentInterceptors,
            serverInterceptors: artifact.serverInterceptors
          });

          if (artifact.config.settings?.delay) {
            await sleep(artifact.config.settings.delay);
          }

          sendWsData(socket, data);
        }

        if (frame.isBinary) return;

        const graphqlSubscriptionInput = getGraphqlTransportWsInput(frame.raw.toString());

        if (!graphqlSubscriptionInput) {
          console.warn('[mock-config] Error parsing graphQL subscription input');
          return;
        }

        if (graphqlSubscriptionInput.type === 'connection_init') {
          socket.send(JSON.stringify({ type: 'connection_ack' }));
          return;
        }

        if (graphqlSubscriptionInput.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (graphqlSubscriptionInput.type === 'complete') {
          completedSubscriptionIds.add(graphqlSubscriptionInput.id);
          return;
        }

        if (graphqlSubscriptionInput.type !== 'subscribe') {
          console.warn(
            'Unsupported graphQL subscription input type',
            graphqlSubscriptionInput.type
          );
          return;
        }

        const operationId = graphqlSubscriptionInput.id;
        completedSubscriptionIds.delete(operationId);

        const query = parseGraphQLQuery(graphqlSubscriptionInput.payload?.query ?? '');
        if (!query) return;

        const matchedGraphqlTransportWsRequestArtifacts = matchGraphqlTransportWsRequestArtifacts({
          artifacts: graphqlTransportWsRequestArtifacts,
          meta: {
            path: requestPathname,
            eventName: query.eventName,
            query: graphqlSubscriptionInput.payload?.query,
            operationType: query.operationType,
            operationName: query.operationName
          }
        });

        const matchedArtifact = matchedGraphqlTransportWsRequestArtifacts.find(({ config }) => {
          if (!config.entities) return true;

          const entityEntries = Object.entries(config.entities) as Entries<
            Required<GraphQLEntitiesByEntityName>
          >;

          return entityEntries.every(([_, valueOrComparator]) => {
            const actualEntity = graphqlSubscriptionInput.payload?.variables;

            if (isComparator(valueOrComparator)) {
              const comparator = valueOrComparator;
              return resolveEntityValues({ actual: actualEntity, comparator });
            }

            const comparator = equals(valueOrComparator);
            return resolveEntityValues({ actual: actualEntity, comparator });
          });
        });

        if (!matchedArtifact) return;

        const graphqlTransportWsParams: GraphqlTransportWsParams = {
          complete: () => {
            if (completedSubscriptionIds.has(operationId)) return;
            completedSubscriptionIds.add(operationId);
            sendGraphqlTransportWsComplete(socket, operationId);
          },
          entities: matchedArtifact.config.entities ?? {},
          eventName: query.eventName,
          next: (payload) => {
            if (completedSubscriptionIds.has(operationId)) return;
            sendGraphqlTransportWsData(socket, operationId, payload);
          },
          operationName: query.operationName,
          query: graphqlSubscriptionInput.payload?.query,
          raw,
          setDelay: async (delay) => {
            await sleep(delay);
          },
          socket,
          variables: graphqlSubscriptionInput.payload?.variables ?? {}
        };

        const resolvedData =
          typeof matchedArtifact.config.data === 'function'
            ? await matchedArtifact.config.data(graphqlTransportWsParams)
            : matchedArtifact.config.data;

        if (matchedArtifact.config.settings?.delay) {
          await sleep(matchedArtifact.config.settings.delay);
        }

        if (completedSubscriptionIds.has(operationId)) return;

        sendGraphqlTransportWsData(socket, operationId, resolvedData);
      });

      socket.on('close', async () => {
        console.log('WS.CLOSE', request.id, request.api);
      });
      socket.on('error', async () => {
        console.log('WS.ERROR', request.id, request.api);
      });
    }
  );
};
