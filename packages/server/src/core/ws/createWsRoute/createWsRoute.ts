import type { Buffer } from 'node:buffer';
import type { RawData, WebSocketServer } from 'ws';

import type {
  CloseWsRequestArtifact,
  ConnectionWsRequestArtifact,
  Entries,
  ErrorWsRequestArtifact,
  GraphQLEntitiesByEntityName,
  GraphqlTransportWsExecutionResult,
  GraphqlTransportWsParams,
  GraphqlTransportWsRequestArtifact,
  MessageWsRequestArtifact,
  WsCloseParams,
  WsConnectionParams,
  WsErrorParams,
  WsEventContext,
  WsMessageParams,
  WsRequestArtifact,
  WsSocket
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
  broadcastWsData,
  createWsFrame,
  isCloseRequestMatchedByEntities,
  isConnectionRequestMatchedByEntities,
  isErrorRequestMatchedByEntities,
  isMessageRequestMatchedByEntities,
  matchGraphqlTransportWsRequestArtifacts,
  matchMessageRequestArtifacts,
  sendGraphqlTransportWsComplete,
  sendGraphqlTransportWsData,
  sendWsData
} from './helpers';

interface CreateWsRouteParams {
  server: WebSocketServer;
  wsRequestArtifacts: WsRequestArtifact[];
}

export const createWsRoute = ({ server, wsRequestArtifacts }: CreateWsRouteParams) => {
  let eventId = 0;
  const createWsEventContext = (): WsEventContext => {
    eventId += 1;
    return { id: eventId, timestamp: Date.now() };
  };

  return server.on('connection', async (rawSocket, handshake) => {
    const socket = rawSocket as WsSocket;

    const broadcast = (data: unknown) => broadcastWsData(server, data);
    const send = (data: unknown) => sendWsData(socket, data);
    const setDelay = async (delay: number) => {
      await sleep(delay);
    };

    const serverInterceptors = wsRequestArtifacts[0].serverInterceptors ?? [];
    const completedSubscriptionIds = new Set<string>();

    const [requestPathname] = handshake.url!.split('?');
    const matchedRequestArtifacts = wsRequestArtifacts.filter((artifact) => {
      if (artifact.baseUrl === '/') return true;
      return (
        requestPathname === artifact.baseUrl || requestPathname.startsWith(`${artifact.baseUrl}/`)
      );
    });

    const {
      connectionArtifacts,
      graphqlTransportWsRequestArtifacts,
      messageWsRequestArtifacts,
      closeWsRequestArtifacts,
      errorWsRequestArtifacts
    } = matchedRequestArtifacts.reduce(
      (acc, artifact) => {
        if (artifact.type === 'connection') acc.connectionArtifacts.push(artifact);
        if (artifact.type === 'graphql-ws') acc.graphqlTransportWsRequestArtifacts.push(artifact);
        if (artifact.type === 'message') acc.messageWsRequestArtifacts.push(artifact);
        if (artifact.type === 'close') acc.closeWsRequestArtifacts.push(artifact);
        if (artifact.type === 'error') acc.errorWsRequestArtifacts.push(artifact);

        return acc;
      },
      {
        connectionArtifacts: [] as ConnectionWsRequestArtifact[],
        graphqlTransportWsRequestArtifacts: [] as GraphqlTransportWsRequestArtifact[],
        messageWsRequestArtifacts: [] as MessageWsRequestArtifact[],
        closeWsRequestArtifacts: [] as CloseWsRequestArtifact[],
        errorWsRequestArtifacts: [] as ErrorWsRequestArtifact[]
      }
    );

    const handleOpen = async () => {
      const event = createWsEventContext();
      const meta = { type: 'ws', event: 'open' } as const;

      await callWsRequestInterceptors({ event, meta, socket, broadcast, send }, serverInterceptors);

      const matchedArtifact = connectionArtifacts.find((artifact) =>
        isConnectionRequestMatchedByEntities(handshake, artifact.config.entities)
      );

      if (!matchedArtifact) return;

      await callWsRequestInterceptors(
        { event, meta, socket, broadcast, send },
        matchedArtifact.componentInterceptors ?? []
      );

      const params: WsConnectionParams = {
        event,
        broadcast,
        handshake,
        socket,
        send,
        setDelay
      };

      const resolvedData = await matchedArtifact.config.data(params);

      const data = await callWsResponseInterceptors(
        { event, data: resolvedData, meta, socket, broadcast, send },
        {
          componentInterceptors: matchedArtifact.componentInterceptors,
          serverInterceptors: matchedArtifact.serverInterceptors
        }
      );

      sendWsData(socket, data);
    };

    const handleMessage = async (raw: RawData, isBinary: boolean) => {
      const frame = createWsFrame(raw, isBinary);
      const event = createWsEventContext();
      const meta = { type: 'ws', event: 'message', messageType: 'raw' } as const;

      const wsParams: WsMessageParams = {
        event,
        ...frame,
        handshake,
        broadcast,
        socket,
        send,
        setDelay
      };

      await callWsRequestInterceptors(
        { event, meta, frame, socket, broadcast, send },
        serverInterceptors
      );

      const matchedMessageArtifacts = matchMessageRequestArtifacts({
        artifacts: messageWsRequestArtifacts,
        meta: {
          path: requestPathname
        }
      });

      const matchedMessageArtifact = matchedMessageArtifacts.find((artifact) =>
        isMessageRequestMatchedByEntities(frame, artifact.config.entities)
      );

      if (matchedMessageArtifact) {
        await callWsRequestInterceptors(
          { event, meta, frame, socket, broadcast, send },
          matchedMessageArtifact.componentInterceptors ?? []
        );

        const resolvedData = await matchedMessageArtifact.config.data(wsParams);
        const data = await callWsResponseInterceptors(
          { event, data: resolvedData, meta, frame, socket, broadcast, send },
          {
            componentInterceptors: matchedMessageArtifact.componentInterceptors,
            serverInterceptors: matchedMessageArtifact.serverInterceptors
          }
        );

        if (matchedMessageArtifact.config.settings?.delay) {
          await sleep(matchedMessageArtifact.config.settings.delay);
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

      const graphqlTransportWsMeta = {
        type: 'ws',
        event: 'message',
        messageType: 'graphql-ws'
      } as const;

      await callWsRequestInterceptors(
        { event, meta: graphqlTransportWsMeta, frame, socket, broadcast, send },
        serverInterceptors
      );

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

      await callWsRequestInterceptors(
        { event, meta: graphqlTransportWsMeta, frame, socket, broadcast, send },
        matchedArtifact.componentInterceptors ?? []
      );

      const graphqlTransportWsParams: GraphqlTransportWsParams = {
        event,
        complete: () => {
          if (completedSubscriptionIds.has(operationId)) return;
          completedSubscriptionIds.add(operationId);
          sendGraphqlTransportWsComplete(socket, operationId);
        },
        entities: matchedArtifact.config.entities ?? {},
        eventName: query.eventName,
        handshake,
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

      const data = await callWsResponseInterceptors(
        {
          event,
          data: resolvedData,
          meta: graphqlTransportWsMeta,
          frame,
          socket,
          broadcast,
          send
        },
        {
          componentInterceptors: matchedArtifact.componentInterceptors,
          serverInterceptors: matchedArtifact.serverInterceptors
        }
      );

      if (matchedArtifact.config.settings?.delay) {
        await sleep(matchedArtifact.config.settings.delay);
      }

      if (completedSubscriptionIds.has(operationId)) return;

      sendGraphqlTransportWsData(socket, operationId, data as GraphqlTransportWsExecutionResult);
    };

    const handleClose = async (code: number, reasonBuffer: Buffer) => {
      const reason = reasonBuffer.toString();
      const event = createWsEventContext();
      const meta = { type: 'ws', event: 'close' } as const;

      await callWsRequestInterceptors(
        { event, meta, code, reason, socket, broadcast, send },
        serverInterceptors
      );

      const matchedArtifact = closeWsRequestArtifacts.find((artifact) =>
        isCloseRequestMatchedByEntities({ code, reason }, artifact.config.entities)
      );

      if (!matchedArtifact) return;

      await callWsRequestInterceptors(
        { event, meta, code, reason, socket, broadcast, send },
        matchedArtifact.componentInterceptors ?? []
      );

      const params: WsCloseParams = {
        event,
        broadcast,
        code,
        handshake,
        reason,
        socket,
        setDelay
      };

      // ✅ important:
      // close and error responses are not sent automatically, the socket is already gone,
      // handlers and response interceptors call broadcast themselves when they need to,
      // so the delay is applied before the handler runs instead of before a send
      if (matchedArtifact.config.settings?.delay) {
        await sleep(matchedArtifact.config.settings.delay);
      }

      const resolvedData = await matchedArtifact.config.data(params);

      await callWsResponseInterceptors(
        { event, data: resolvedData, meta, code, reason, socket, broadcast, send },
        {
          componentInterceptors: matchedArtifact.componentInterceptors,
          serverInterceptors: matchedArtifact.serverInterceptors
        }
      );
    };

    const handleError = async (error: NodeJS.ErrnoException) => {
      const event = createWsEventContext();
      const meta = { type: 'ws', event: 'error' } as const;

      await callWsRequestInterceptors(
        { event, meta, error, socket, broadcast, send },
        serverInterceptors
      );

      const matchedArtifact = errorWsRequestArtifacts.find((artifact) =>
        isErrorRequestMatchedByEntities(error, artifact.config.entities)
      );

      if (!matchedArtifact) return;

      await callWsRequestInterceptors(
        { event, meta, error, socket, broadcast, send },
        matchedArtifact.componentInterceptors ?? []
      );

      const params: WsErrorParams = {
        event,
        broadcast,
        error,
        handshake,
        socket,
        send,
        setDelay
      };

      if (matchedArtifact.config.settings?.delay) {
        await sleep(matchedArtifact.config.settings.delay);
      }

      const resolvedData = await matchedArtifact.config.data(params);

      await callWsResponseInterceptors(
        { event, data: resolvedData, meta, socket, broadcast, send },
        {
          componentInterceptors: matchedArtifact.componentInterceptors,
          serverInterceptors: matchedArtifact.serverInterceptors
        }
      );
    };

    socket.on('message', (raw, isBinary) => handleMessage(raw, isBinary));

    socket.on('close', (code, reasonBuffer) => handleClose(code, reasonBuffer));

    socket.on('error', (error) => handleError(error));

    await handleOpen();
  });
};
