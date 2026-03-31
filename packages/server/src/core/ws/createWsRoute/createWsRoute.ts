import type { Express } from 'express';
import type { RawData, WebSocket } from 'ws';

import { flatten } from 'flat';
import { WebSocketServer } from 'ws';

import type {
  EntityDescriptor,
  Entries,
  PlainObject,
  TopLevelPlainEntityArray,
  TopLevelPlainEntityDescriptor,
  WsEntitiesByEntityName,
  WsEntity,
  WsParams,
  WsRequestArtifact
} from '@/utils/types';

import {
  convertToEntityDescriptor,
  isEntityDescriptor,
  isPlainObject,
  resolveEntityValues,
  urlJoin
} from '@/utils/helpers';
import { sleep } from '@/utils/sleep';
import { WS_MESSAGE_EVENT } from '@/utils/types';

interface CreateWsRouteParams {
  server: Express;
  wsRequestArtifacts: WsRequestArtifact[];
}

const parseMessage = (message: string) => {
  try {
    return JSON.parse(message) as {
      event: string;
      meta?: Record<string, unknown>;
      payload?: unknown;
    };
  } catch {
    return message as string;
  }
};

const sendWsData = (socket: WebSocket, data: unknown) => {
  if (data === undefined) return;
  socket.send(typeof data === 'string' ? data : JSON.stringify(data));
};

export const createWsRoute = ({ server, wsRequestArtifacts }: CreateWsRouteParams) => {
  const wsServer = new WebSocketServer({
    noServer: true
  });

  const wsBaseUrls = new Set(wsRequestArtifacts.map((artifact) => urlJoin('/', artifact.baseUrl)));

  const originalListen = server.listen.bind(server);
  server.listen = ((...args: any[]) => {
    const httpServer = originalListen(...args);
    httpServer.on('upgrade', (request, socket, head) => {
      const shouldHandleUpgrade = wsBaseUrls.has(urlJoin('/', request.url ?? '/'));
      if (!shouldHandleUpgrade) {
        socket.destroy();
        return;
      }

      wsServer.handleUpgrade(request, socket, head, (upgradedSocket) => {
        wsServer.emit('connection', upgradedSocket, request);
      });
    });
    return httpServer;
  }) as typeof server.listen;

  wsServer.on('connection', (socket) => {
    socket.on('message', async (raw: RawData) => {
      const wsMessagesRequestArtifacts = wsRequestArtifacts.filter(
        (artifact) => artifact.event === WS_MESSAGE_EVENT
      );

      if (wsMessagesRequestArtifacts.length) {
        let data = raw;
        wsMessagesRequestArtifacts.forEach(async (artifact) => {
          if (artifact.componentRequestInterceptor) {
            await artifact.componentRequestInterceptor({
              message: raw,
              socket,
              send: (data: unknown) => sendWsData(socket, data)
            });
          }

          if (artifact.componentResponseInterceptor) {
            data = artifact.componentResponseInterceptor(data, {
              message: raw,
              socket,
              send: (data: unknown) => sendWsData(socket, data)
            } as unknown as WsParams);
          }

          if (typeof artifact.config.data === 'function') {
            await artifact.config.data?.({
              raw,
              event: WS_MESSAGE_EVENT.toString(),
              payload: {},
              meta: {},
              socket,
              send: (data: unknown) => sendWsData(socket, data),
              setDelay: async (delay) => {
                await sleep(delay === Infinity ? 99999999 : delay);
              }
            });
          }
        });
      }

      const wsEventsRequestArtifacts = wsRequestArtifacts.filter(
        (artifact) => artifact.event !== WS_MESSAGE_EVENT
      );

      const message = parseMessage(raw.toString());
      if (!isPlainObject(message) || typeof message.event !== 'string') return;

      const params: WsParams = {
        raw,
        event: message.event,
        meta: message.meta ?? {},
        payload: message.payload,
        socket,
        send: (data: unknown) => sendWsData(socket, data),
        setDelay: async (delay) => {
          await sleep(delay === Infinity ? 99999999 : delay);
        }
      };

      const matchedEventArtifact = wsEventsRequestArtifacts.find((artifact) => {
        const isEventMatched =
          artifact.event instanceof RegExp
            ? artifact.event.test(params.event)
            : artifact.event === params.event;
        if (!isEventMatched) return false;

        if (!artifact.config.entities) return true;
        const entityEntries = Object.entries(artifact.config.entities) as Entries<
          Required<WsEntitiesByEntityName>
        >;

        return entityEntries.every(([entityName, entityDescriptorOrValue]) => {
          const entityValues: Record<keyof WsEntitiesByEntityName, unknown> = {
            meta: params.meta,
            payload: params.payload
          };
          const actualEntity = entityValues[entityName];

          if (isEntityDescriptor(entityDescriptorOrValue)) {
            const descriptor: EntityDescriptor = entityDescriptorOrValue;
            if (descriptor.checkMode === 'exists' || descriptor.checkMode === 'notExists') {
              return resolveEntityValues({
                actualValue: actualEntity,
                checkMode: descriptor.checkMode
              });
            }

            return resolveEntityValues({
              actualValue: actualEntity,
              descriptorValue: descriptor.value,
              checkMode: descriptor.checkMode,
              oneOf: descriptor.oneOf ?? false
            });
          }

          if (Array.isArray(entityDescriptorOrValue)) {
            if (!Array.isArray(actualEntity)) return false;

            return resolveEntityValues({
              actualValue: actualEntity,
              descriptorValue: entityDescriptorOrValue,
              checkMode: 'equals'
            });
          }

          const flattenedEntity = flatten<PlainObject, PlainObject>(
            (actualEntity ?? {}) as PlainObject
          );
          const entityValueEntries = Object.entries(entityDescriptorOrValue) as Entries<
            Exclude<WsEntity, TopLevelPlainEntityArray | TopLevelPlainEntityDescriptor>
          >;

          return entityValueEntries.every(
            ([entityPropertyKey, entityPropertyDescriptorOrValue]) => {
              const entityPropertyDescriptor = convertToEntityDescriptor(
                entityPropertyDescriptorOrValue
              );
              const actualPropertyValue = flattenedEntity[entityPropertyKey];

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
      });
      if (!matchedEventArtifact) return;

      if (matchedEventArtifact.componentRequestInterceptor) {
        await matchedEventArtifact.componentRequestInterceptor(params);
      }

      const resolvedData =
        typeof matchedEventArtifact.config.data === 'function'
          ? await matchedEventArtifact.config.data(params)
          : matchedEventArtifact.config.data;

      let data = resolvedData;
      if (matchedEventArtifact.componentResponseInterceptor) {
        data = matchedEventArtifact.componentResponseInterceptor(data, params);
      }

      sendWsData(socket, data);
    });
  });
};
