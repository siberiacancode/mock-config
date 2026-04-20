import type { IncomingMessage } from 'node:http';
import type { RawData, WebSocketServer } from 'ws';

import { flatten } from 'flat';
import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';

import type {
  EntityDescriptor,
  Entries,
  GraphQLEntity,
  GraphQLSubscriptionParams,
  PlainObject,
  TopLevelPlainEntityDescriptor,
  WsFrame,
  WsParams,
  WsRequestArtifact
} from '@/utils/types';

import {
  convertToEntityDescriptor,
  getGraphQLSubscriptionInput,
  isEntityDescriptor,
  parseCookie,
  parseGraphQLQuery,
  parseQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { matchGraphQLSubscriptionRequestArtifacts } from './helpers/matchGraphQLSubscriptionRequestArtifacts/matchGraphQLSubscriptionRequestArtifacts';
import { matchRawRequestArtifacts } from './helpers/matchRawRequestArtifacts/matchRawRequestArtifacts';

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
        query: Record<string, string | string[]>;
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

        for (const artifact of wsRequestArtifacts) {
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
              artifacts: [artifact],
              meta: {
                path: requestPathname,
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

            sendGraphQLSubscriptionData(socket, resolvedData);
            return;
          }

          if (artifact.type === 'raw') {
            const matchedRawArtifacts = matchRawRequestArtifacts({
              artifacts: [artifact],
              meta: {
                path: requestPathname
              }
            });
            if (!matchedRawArtifacts.length) continue;

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

          console.warn(`Unsupported artifact type: ${artifact.type}`);
        }
      });
    }
  );
};
