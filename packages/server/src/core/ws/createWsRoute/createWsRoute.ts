import type { Express } from 'express';
import type { Buffer } from 'node:buffer';
import type { RawData, WebSocketServer } from 'ws';

import { WebSocket } from 'ws';

import type {
  CloseWsRequestArtifact,
  ConnectionWsRequestArtifact,
  Entries,
  ErrorWsRequestArtifact,
  GraphQLEntitiesByEntityName,
  GraphqlTransportWsExecutionResult,
  GraphqlTransportWsParams,
  GraphqlTransportWsRequestArtifact,
  RawWsRequestArtifact,
  WsCloseParams,
  WsConnectionParams,
  WsErrorParams,
  WsFrame,
  WsMessageParams,
  WsRequestArtifact
} from '@/utils/types';

import {
  callWsRequestInterceptors,
  callWsResponseInterceptors,
  getGraphqlTransportWsInput,
  isComparator,
  parseCookie,
  parseGraphQLQuery,
  parseQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { equals } from '../../entities';
import {
  broadcastWsData,
  isRequestMatchedByEntities,
  matchGraphqlTransportWsRequestArtifacts,
  matchRawRequestArtifacts,
  sendGraphqlTransportWsComplete,
  sendGraphqlTransportWsData,
  sendWsData
} from './helpers';

interface CreateWsRouteParams {
  server: WebSocketServer;
  wsRequestArtifacts: WsRequestArtifact[];
}

export const createWsRoute = ({ server, wsRequestArtifacts }: CreateWsRouteParams) =>
  server.on(
    'connection',
    async (
      socket,
      request: Express['request'] & {
        queries: Record<string, string | string[]>;
        cookies: Record<string, string>;
      }
    ) => {
      const completedSubscriptionIds = new Set<string>();

      const [requestPathname] = request.url!.split('?');
      const matchedRequestArtifacts = wsRequestArtifacts.filter((artifact) => {
        if (artifact.baseUrl === '/') return true;
        return (
          requestPathname === artifact.baseUrl || requestPathname.startsWith(`${artifact.baseUrl}/`)
        );
      });

      const {
        connectionArtifacts,
        graphqlTransportWsRequestArtifacts,
        rawWsRequestArtifacts,
        closeWsRequestArtifacts,
        errorWsRequestArtifacts
      } = matchedRequestArtifacts.reduce(
        (acc, artifact) => {
          if (artifact.type === 'connection') acc.connectionArtifacts.push(artifact);
          if (artifact.type === 'graphql-ws') acc.graphqlTransportWsRequestArtifacts.push(artifact);
          if (artifact.type === 'raw') acc.rawWsRequestArtifacts.push(artifact);
          if (artifact.type === 'close') acc.closeWsRequestArtifacts.push(artifact);
          if (artifact.type === 'error') acc.errorWsRequestArtifacts.push(artifact);

          return acc;
        },
        {
          connectionArtifacts: [] as ConnectionWsRequestArtifact[],
          graphqlTransportWsRequestArtifacts: [] as GraphqlTransportWsRequestArtifact[],
          rawWsRequestArtifacts: [] as RawWsRequestArtifact[],
          closeWsRequestArtifacts: [] as CloseWsRequestArtifact[],
          errorWsRequestArtifacts: [] as ErrorWsRequestArtifact[]
        }
      );

      request.queries = parseQuery(request.url!);
      request.cookies = parseCookie(request.headers.cookie ?? '');

      for (const artifact of connectionArtifacts) {
        if (!isRequestMatchedByEntities(request, artifact.config.entities)) continue;

        const broadcast = (data: unknown) => broadcastWsData(server, data);
        const send = (data: unknown) => sendWsData(socket, data);

        if (artifact.componentInterceptors) {
          await callWsRequestInterceptors({
            meta: {
              type: 'ws',
              event: 'open'
            },
            interceptors: artifact.componentInterceptors,
            socket,
            broadcast,
            send
          });
        }

        const params: WsConnectionParams = {
          broadcast,
          request,
          socket,
          send,
          setDelay: async (delay: number) => {
            await sleep(delay);
          }
        };

        const resolvedData = await artifact.config.data(params);

        const data = await callWsResponseInterceptors({
          data: resolvedData,
          meta: {
            type: 'ws',
            event: 'open'
          },
          componentInterceptors: artifact.componentInterceptors,
          serverInterceptors: artifact.serverInterceptors,
          socket,
          broadcast,
          send
        });

        sendWsData(socket, data);
      }

      socket.on('message', async (raw: RawData, isBinary: boolean) => {
        const frame: WsFrame = isBinary
          ? { isBinary: true, raw: raw as Buffer }
          : { isBinary: false, raw: raw.toString() };
        const broadcast = (data: unknown) => broadcastWsData(server, data);
        const send = (data: unknown) => sendWsData(socket, data);

        const wsParams: WsMessageParams = {
          ...frame,
          broadcast,
          socket,
          send,
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
            await callWsRequestInterceptors({
              meta: {
                type: 'ws',
                event: 'message',
                messageType: 'raw'
              },
              interceptors: artifact.componentInterceptors,
              socket,
              broadcast,
              send
            });
          }

          const resolvedData = await artifact.config.data(wsParams);

          const data = await callWsResponseInterceptors({
            data: resolvedData,
            meta: {
              type: 'ws',
              event: 'message',
              messageType: 'raw'
            },
            componentInterceptors: artifact.componentInterceptors,
            serverInterceptors: artifact.serverInterceptors,
            socket,
            broadcast,
            send
          });

          if (artifact.config.settings?.delay) {
            await sleep(artifact.config.settings.delay);
          }

          sendWsData(socket, data);
        }

        if (frame.isBinary) return;

        // maybe move ws subscription logic in createGraphQLRoute
        // to achieve matching graphql component operationTypes (query, mutation, subscription)
        // with corresponding interceptors (graphql.request.query, graphql.request.mutation, graphql.request.subscription)
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

        if (matchedArtifact.componentInterceptors) {
          await callWsRequestInterceptors({
            meta: {
              type: 'ws',
              event: 'message',
              messageType: 'graphql-ws'
            },
            interceptors: matchedArtifact.componentInterceptors,
            socket,
            broadcast,
            send
          });
        }

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

        const data = await callWsResponseInterceptors({
          data: resolvedData,
          meta: {
            type: 'ws',
            event: 'message',
            messageType: 'graphql-ws'
          },
          componentInterceptors: matchedArtifact.componentInterceptors,
          serverInterceptors: matchedArtifact.serverInterceptors,
          socket,
          broadcast,
          send
        });

        if (matchedArtifact.config.settings?.delay) {
          await sleep(matchedArtifact.config.settings.delay);
        }

        if (completedSubscriptionIds.has(operationId)) return;

        sendGraphqlTransportWsData(socket, operationId, data as GraphqlTransportWsExecutionResult);
      });

      socket.on('close', async (code: number, reason: Buffer) => {
        for (const artifact of closeWsRequestArtifacts) {
          if (!isRequestMatchedByEntities(request, artifact.config.entities)) continue;

          const broadcast = (data: unknown) => broadcastWsData(server, data);
          const send = (data: unknown) => sendWsData(socket, data);

          if (artifact.componentInterceptors) {
            await callWsRequestInterceptors({
              meta: {
                type: 'ws',
                event: 'close'
              },
              interceptors: artifact.componentInterceptors,
              socket,
              broadcast,
              send
            });
          }

          const params: WsCloseParams = {
            broadcast,
            code,
            reason: reason.toString(),
            request,
            socket,
            setDelay: async (delay: number) => {
              await sleep(delay);
            }
          };

          const resolvedData = await artifact.config.data?.(params);

          const data = await callWsResponseInterceptors({
            data: resolvedData,
            meta: {
              type: 'ws',
              event: 'close'
            },
            componentInterceptors: artifact.componentInterceptors,
            serverInterceptors: artifact.serverInterceptors,
            socket,
            broadcast,
            send
          });

          if (artifact.config.settings?.delay) {
            await sleep(artifact.config.settings.delay);
          }

          broadcastWsData(server, data);
        }
      });
      socket.on('error', async (error: Error) => {
        for (const artifact of errorWsRequestArtifacts) {
          if (!isRequestMatchedByEntities(request, artifact.config.entities)) continue;

          const broadcast = (data: unknown) => broadcastWsData(server, data);
          const send = (data: unknown) => sendWsData(socket, data);

          if (artifact.componentInterceptors) {
            await callWsRequestInterceptors({
              meta: {
                type: 'ws',
                event: 'error'
              },
              interceptors: artifact.componentInterceptors,
              socket,
              broadcast,
              send
            });
          }

          const params: WsErrorParams = {
            broadcast,
            error,
            request,
            socket,
            send,
            setDelay: async (delay: number) => {
              await sleep(delay);
            }
          };

          const resolvedData = await artifact.config.data?.(params);

          const data = await callWsResponseInterceptors({
            data: resolvedData,
            meta: {
              type: 'ws',
              event: 'error'
            },
            componentInterceptors: artifact.componentInterceptors,
            serverInterceptors: artifact.serverInterceptors,
            socket,
            broadcast,
            send
          });

          if (artifact.config.settings?.delay) {
            await sleep(artifact.config.settings.delay);
          }

          if (socket.readyState === WebSocket.OPEN) {
            sendWsData(socket, data);
          } else {
            broadcastWsData(server, data);
          }
        }
      });
    }
  );
