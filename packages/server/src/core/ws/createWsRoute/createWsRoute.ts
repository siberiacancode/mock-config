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
  WsMessageParams,
  WsRequestArtifact
} from '@/utils/types';

import {
  callWsRequestInterceptors,
  callWsResponseInterceptors,
  getGraphqlTransportWsInput,
  isComparator,
  parseGraphQLQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { equals } from '../../entities';
import {
  addTaskInWsQueue,
  broadcastWsData,
  createWsFrame,
  isCloseRequestMatchedByEntities,
  isConnectionRequestMatchedByEntities,
  isRawRequestMatchedByEntities,
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
  server.on('connection', async (socket, request) => {
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

    const broadcast = (data: unknown) => broadcastWsData(server, data);
    const send = (data: unknown) => sendWsData(socket, data);
    const setDelay = async (delay: number) => {
      await sleep(delay);
    };

    const handleOpen = async () => {
      const matchedArtifact = connectionArtifacts.find((artifact) =>
        isConnectionRequestMatchedByEntities(request, artifact.config.entities)
      );

      if (!matchedArtifact) return;

      if (matchedArtifact.componentInterceptors) {
        await callWsRequestInterceptors({
          meta: {
            type: 'ws',
            event: 'open'
          },
          interceptors: matchedArtifact.componentInterceptors,
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
        setDelay
      };

      const resolvedData = await matchedArtifact.config.data(params);

      const data = await callWsResponseInterceptors({
        data: resolvedData,
        meta: {
          type: 'ws',
          event: 'open'
        },
        componentInterceptors: matchedArtifact.componentInterceptors,
        serverInterceptors: matchedArtifact.serverInterceptors,
        socket,
        broadcast,
        send
      });

      sendWsData(socket, data);
    };

    const handleMessage = async (raw: RawData, isBinary: boolean) => {
      const frame = createWsFrame(raw, isBinary);

      const wsParams: WsMessageParams = {
        ...frame,
        broadcast,
        socket,
        send,
        setDelay
      };

      const matchedRawArtifacts = matchRawRequestArtifacts({
        artifacts: rawWsRequestArtifacts,
        meta: {
          path: requestPathname
        }
      });

      const matchedRawArtifact = matchedRawArtifacts.find((artifact) =>
        isRawRequestMatchedByEntities(frame, artifact.config.entities)
      );

      if (matchedRawArtifact) {
        if (matchedRawArtifact.componentInterceptors) {
          await callWsRequestInterceptors({
            meta: {
              type: 'ws',
              event: 'message',
              messageType: 'raw'
            },
            frame,
            interceptors: matchedRawArtifact.componentInterceptors,
            socket,
            broadcast,
            send
          });
        }

        const resolvedData = await matchedRawArtifact.config.data(wsParams);
        const data = await callWsResponseInterceptors({
          data: resolvedData,
          meta: {
            type: 'ws',
            event: 'message',
            messageType: 'raw'
          },
          frame,
          componentInterceptors: matchedRawArtifact.componentInterceptors,
          serverInterceptors: matchedRawArtifact.serverInterceptors,
          socket,
          broadcast,
          send
        });

        if (matchedRawArtifact.config.settings?.delay) {
          await sleep(matchedRawArtifact.config.settings.delay);
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
        console.warn('Unsupported graphQL subscription input type', graphqlSubscriptionInput.type);
        return;
      }

      const operationId = graphqlSubscriptionInput.id;
      completedSubscriptionIds.delete(operationId);

      const query = parseGraphQLQuery(graphqlSubscriptionInput.payload.query);
      if (!query) return;

      const matchedGraphqlTransportWsRequestArtifacts = matchGraphqlTransportWsRequestArtifacts({
        artifacts: graphqlTransportWsRequestArtifacts,
        meta: {
          path: requestPathname,
          eventName: query.eventName,
          query: graphqlSubscriptionInput.payload.query,
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
          const actualEntity = graphqlSubscriptionInput.payload.variables;

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
          frame,
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
        query: graphqlSubscriptionInput.payload.query,
        raw,
        setDelay,
        socket,
        variables: graphqlSubscriptionInput.payload.variables ?? {}
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
        frame,
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
    };

    const handleClose = async (code: number, reason: Buffer) => {
      const closeParams = { code, reason: reason.toString() };

      const matchedArtifact = closeWsRequestArtifacts.find((artifact) =>
        isCloseRequestMatchedByEntities(closeParams, artifact.config.entities)
      );

      if (!matchedArtifact) return;

      if (matchedArtifact.componentInterceptors) {
        await callWsRequestInterceptors({
          meta: {
            type: 'ws',
            event: 'close'
          },
          interceptors: matchedArtifact.componentInterceptors,
          socket,
          broadcast,
          send
        });
      }

      const params: WsCloseParams = {
        broadcast,
        code,
        reason: closeParams.reason,
        request,
        socket,
        setDelay
      };

      const resolvedData = await matchedArtifact.config.data(params);

      const data = await callWsResponseInterceptors({
        data: resolvedData,
        meta: {
          type: 'ws',
          event: 'close'
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

      broadcastWsData(server, data);
    };

    const handleError = async (error: Error) => {
      const [matchedArtifact] = errorWsRequestArtifacts;

      if (!matchedArtifact) return;

      if (matchedArtifact.componentInterceptors) {
        await callWsRequestInterceptors({
          meta: {
            type: 'ws',
            event: 'error'
          },
          interceptors: matchedArtifact.componentInterceptors,
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
        setDelay
      };

      const resolvedData = await matchedArtifact.config.data(params);

      const data = await callWsResponseInterceptors({
        data: resolvedData,
        meta: {
          type: 'ws',
          event: 'error'
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

      if (socket.readyState === WebSocket.OPEN) {
        sendWsData(socket, data);
      } else {
        broadcastWsData(server, data);
      }
    };

    socket.on('message', (raw, isBinary) =>
      addTaskInWsQueue(socket, () => handleMessage(raw, isBinary))
    );

    socket.on('close', (code, reason) => addTaskInWsQueue(socket, () => handleClose(code, reason)));

    socket.on('error', (error) => addTaskInWsQueue(socket, () => handleError(error)));

    await addTaskInWsQueue(socket, handleOpen);
  });
