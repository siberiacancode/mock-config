import type { Express } from 'express';
import type { IncomingMessage } from 'node:http';
import type { RawData, WebSocket } from 'ws';

import { flatten } from 'flat';
import { WebSocketServer } from 'ws';

import type {
  EntityDescriptor,
  Entries,
  GraphQLEntity,
  GraphQLSubscriptionParams,
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
  getGraphQLSubscriptionInput,
  isEntityDescriptor,
  isPlainObject,
  normalizeUrl,
  parseQuery,
  resolveEntityValues,
  sleep,
  urlJoin
} from '@/utils/helpers';
import { WS_MESSAGE_EVENT } from '@/utils/types';

import { matchGraphQLSubscriptionRequestArtifacts } from './helpers/matchGraphQLSubscriptionRequestArtifacts/matchGraphQLSubscriptionRequestArtifacts';

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

const sendGraphQLSubscriptionData = (socket: WebSocket, data: unknown) => {
  if (data === undefined) return;
  socket.send(typeof data === 'string' ? data : JSON.stringify(data));
};

const getPathnameFromUpgradeRequest = (upgradeRequest: IncomingMessage) => {
  const raw = upgradeRequest.url ?? '/';
  const pathname = raw.split('?')[0] || '/';
  return normalizeUrl(pathname);
};

export const createWsRoute = ({ server, wsRequestArtifacts }: CreateWsRouteParams) => {
  const wsServer = new WebSocketServer({
    noServer: true
  });

  const wsBaseUrls = new Set(wsRequestArtifacts.map((artifact) => urlJoin('/', artifact.baseUrl)));

  const originalListen = server.listen.bind(server);
  server.listen = ((...args: unknown[]) => {
    const httpServer = originalListen(...(args as Parameters<typeof originalListen>));
    httpServer.on('upgrade', (request, socket, head) => {
      const pathname = (request.url ?? '/').split('?')[0] ?? '/';
      if (!wsBaseUrls.has(urlJoin('/', pathname))) {
        return;
      }

      wsServer.handleUpgrade(request, socket, head, (upgradedSocket) => {
        wsServer.emit('connection', upgradedSocket, request);
      });
    });
    return httpServer;
  }) as typeof server.listen;

  wsServer.on('connection', (socket, upgradeRequest) => {
    socket.on('message', async (raw: RawData) => {
      if (!upgradeRequest) return;

      const path = getPathnameFromUpgradeRequest(upgradeRequest);

      for (const artifact of wsRequestArtifacts) {
        if (normalizeUrl(artifact.baseUrl) !== path) continue;

        if (artifact.type === 'graphql-ws') {
          let payload: Record<string, unknown> = {};
          try {
            payload = JSON.parse(raw.toString()) as Record<string, unknown>;
          } catch {
            payload = {};
          }

          const graphQLInput = getGraphQLSubscriptionInput(payload);

          if (!graphQLInput.query) continue;

          const query = parseQuery(graphQLInput.query);
          if (!query || query.operationType !== 'subscription') continue;

          const matchedRequestArtifacts = matchGraphQLSubscriptionRequestArtifacts({
            artifacts: [artifact],
            meta: {
              path,
              query: graphQLInput.query,
              operationType: query.operationType,
              operationName: query.operationName
            }
          });
          if (!matchedRequestArtifacts.length) continue;

          const entities = artifact.config.entities;
          const graphQLVariables = graphQLInput.variables;

          let isEntitiesMatched = true;
          if (entities?.variables) {
            const entityDescriptorOrValue = entities.variables;

            if (isEntityDescriptor(entityDescriptorOrValue)) {
              const variablesDescriptor = entityDescriptorOrValue as EntityDescriptor;
              if (
                variablesDescriptor.checkMode === 'exists' ||
                variablesDescriptor.checkMode === 'notExists'
              ) {
                isEntitiesMatched = resolveEntityValues({
                  actualValue: graphQLVariables,
                  checkMode: variablesDescriptor.checkMode
                });
              } else {
                isEntitiesMatched = resolveEntityValues({
                  actualValue: graphQLVariables,
                  descriptorValue: variablesDescriptor.value,
                  checkMode: variablesDescriptor.checkMode,
                  oneOf: variablesDescriptor.oneOf ?? false
                });
              }
            } else {
              const actualEntity = flatten<PlainObject, PlainObject>(graphQLVariables!);
              const entityValueEntries = Object.entries(entityDescriptorOrValue) as Entries<
                Exclude<GraphQLEntity, TopLevelPlainEntityDescriptor>
              >;

              isEntitiesMatched = entityValueEntries.every(
                ([entityPropertyKey, entityPropertyDescriptorOrValue]) => {
                  const entityPropertyDescriptor = convertToEntityDescriptor(
                    entityPropertyDescriptorOrValue
                  );

                  const actualPropertyValue = actualEntity[entityPropertyKey];

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
            }
          }

          if (!isEntitiesMatched) continue;

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

          if (resolvedData !== undefined) {
            sendGraphQLSubscriptionData(socket, resolvedData);
          }
          return;
        }

        if (artifact.type === 'ws') {
          const message = parseMessage(raw.toString());

          if (artifact.event === WS_MESSAGE_EVENT) {
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
            continue;
          }

          if (!isPlainObject(message) || typeof message.event !== 'string') {
            continue;
          }

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

          const isEventMatched =
            artifact.event instanceof RegExp
              ? artifact.event.test(params.event)
              : artifact.event === params.event;
          if (!isEventMatched) continue;

          let isEntitiesMatched = true;
          if (artifact.config.entities) {
            const entityEntries = Object.entries(artifact.config.entities) as Entries<
              Required<WsEntitiesByEntityName>
            >;

            isEntitiesMatched = entityEntries.every(([entityName, entityDescriptorOrValue]) => {
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
          }

          if (!isEntitiesMatched) continue;

          const data =
            typeof artifact.config.data === 'function'
              ? await artifact.config.data(params)
              : artifact.config.data;

          if (!data) return;
          sendWsData(socket, data);
          return;
        }

        console.warn('[mock-server] No matched ws request artifact found');
      }
    });
  });
};
