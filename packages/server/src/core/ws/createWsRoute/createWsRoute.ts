import type { Express } from 'express';
import type { IncomingMessage } from 'node:http';
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
  resolveEntityValues,
  urlJoin
} from '@/utils/helpers';

interface CreateWsRouteParams {
  server: Express;
  wsRequestArtifacts: WsRequestArtifact[];
}

const parseMessage = (message: string) => {
  try {
    return JSON.parse(message) as {
      data?: unknown;
      event?: string;
      meta?: Record<string, unknown>;
    };
  } catch {
    return null;
  }
};

const matchEvent = (artifactEvent: WsRequestArtifact['event'], event: string) =>
  artifactEvent instanceof RegExp ? new RegExp(artifactEvent).test(event) : artifactEvent === event;

const getBaseUrlFromRequest = (request: IncomingMessage) => {
  const requestUrl = request.url ?? '/';
  const [pathname] = requestUrl.split('?');
  return pathname || '/';
};

const normalizePath = (path: string) => {
  if (!path || path === '/') return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
};

const sendWsData = (socket: WebSocket, data: unknown) => {
  if (data === undefined) return;
  socket.send(typeof data === 'string' ? data : JSON.stringify(data));
};

export const createWsRoute = ({ server, wsRequestArtifacts }: CreateWsRouteParams) => {
  const wsServer = new WebSocketServer({
    noServer: true
  });

  const wsBaseUrls = new Set(
    wsRequestArtifacts.map((artifact) => normalizePath(urlJoin('/', artifact.baseUrl)))
  );

  const originalListen = server.listen.bind(server);
  server.listen = ((...args: any[]) => {
    const httpServer = originalListen(...args);
    httpServer.on('upgrade', (request, socket, head) => {
      const requestUrl = request.url ?? '/';
      const [pathname] = requestUrl.split('?');
      const shouldHandleUpgrade = wsBaseUrls.has(normalizePath(pathname || '/'));
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

  wsServer.on('connection', (socket, request) => {
    socket.on('message', async (raw: RawData) => {
      const payload = parseMessage(raw.toString());
      if (!payload?.event) return;

      const connectionBaseUrl = getBaseUrlFromRequest(request);
      const matchedRequestArtifacts = wsRequestArtifacts.filter((artifact) => {
        const expectedBaseUrl = normalizePath(urlJoin('/', artifact.baseUrl));
        if (expectedBaseUrl !== normalizePath(connectionBaseUrl)) return false;
        return matchEvent(artifact.event, payload.event as string);
      });

      if (!matchedRequestArtifacts.length) return;

      const matchedRouteConfig = matchedRequestArtifacts.find(({ config }) => {
        if (!config.entities) return true;
        const entityEntries = Object.entries(config.entities) as Entries<
          Required<WsEntitiesByEntityName>
        >;

        return entityEntries.every(([entityName, entityDescriptorOrValue]) => {
          const actualEntity = payload.data;

          if (entityName === 'payload' && isEntityDescriptor(entityDescriptorOrValue)) {
            const dataDescriptor: EntityDescriptor = entityDescriptorOrValue;
            if (dataDescriptor.checkMode === 'exists' || dataDescriptor.checkMode === 'notExists') {
              return resolveEntityValues({
                actualValue: actualEntity,
                checkMode: dataDescriptor.checkMode
              });
            }

            return resolveEntityValues({
              actualValue: actualEntity,
              descriptorValue: dataDescriptor.value,
              checkMode: dataDescriptor.checkMode,
              oneOf: dataDescriptor.oneOf ?? false
            });
          }

          if (entityName === 'payload' && Array.isArray(entityDescriptorOrValue)) {
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
              const actualPropertyKey = entityPropertyKey;
              const actualPropertyValue = flattenedEntity[actualPropertyKey];

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

      if (!matchedRouteConfig) return;

      const params: WsParams = {
        payload: payload.data,
        event: payload.event,
        socket,
        send: (data) => sendWsData(socket, data)
      };

      if (matchedRouteConfig.componentRequestInterceptor) {
        await matchedRouteConfig.componentRequestInterceptor(params);
      }

      const resolvedData =
        typeof matchedRouteConfig.config.data === 'function'
          ? await matchedRouteConfig.config.data(params)
          : matchedRouteConfig.config.data;

      let data = resolvedData;
      if (matchedRouteConfig.componentResponseInterceptor) {
        data = matchedRouteConfig.componentResponseInterceptor(data, {
          payload: payload.data,
          event: payload.event,
          socket
        });
      }

      sendWsData(socket, data);
    });
  });
};
