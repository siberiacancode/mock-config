import type { IncomingMessage } from 'node:http';
import type { RawData, WebSocketServer } from 'ws';

import { flatten } from 'flat';
import { Buffer } from 'node:buffer';
import { WebSocket } from 'ws';

import type {
  ConnectionWsRequestArtifact,
  EntityDescriptor,
  Entries,
  GraphQLEntitiesByEntityName,
  GraphQLEntity,
  GraphQLWsProtocolParams,
  GraphQLWsRequestArtifact,
  PlainObject,
  RawWsRequestArtifact,
  TopLevelPlainEntityDescriptor,
  WsFrame,
  WsParams,
  WsRequestArtifact
} from '@/utils/types';

import {
  convertToEntityDescriptor,
  getGraphQLWsProtocolInput,
  isEntityDescriptor,
  parseCookie,
  parseGraphQLQuery,
  parseQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { matchGraphQLWsProtocolRequestArtifacts, matchRawRequestArtifacts } from './helpers';

interface CreateWsRouteParams {
  server: WebSocketServer;
  wsRequestArtifacts: WsRequestArtifact[];
}

const sendGraphQLWsProtocolData = (socket: WebSocket, data: unknown) => {
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

      const { connectionArtifacts, graphqlWsRequestArtifacts, rawWsRequestArtifacts } =
        matchedRequestArtifacts.reduce(
          (acc, artifact) => {
            if (artifact.type === 'connection') acc.connectionArtifacts.push(artifact);
            if (artifact.type === 'graphql-ws') acc.graphqlWsRequestArtifacts.push(artifact);
            if (artifact.type === 'raw') acc.rawWsRequestArtifacts.push(artifact);

            return acc;
          },
          {
            connectionArtifacts: [] as ConnectionWsRequestArtifact[],
            graphqlWsRequestArtifacts: [] as GraphQLWsRequestArtifact[],
            rawWsRequestArtifacts: [] as RawWsRequestArtifact[]
          }
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

        const matchedRawArtifacts = matchRawRequestArtifacts({
          artifacts: rawWsRequestArtifacts,
          meta: {
            path: requestPathname
          }
        });

        for (const artifact of matchedRawArtifacts) {
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
        }

        const graphqlSubscriptionInput = getGraphQLWsProtocolInput(frame.raw.toString());
        const query = parseGraphQLQuery(graphqlSubscriptionInput.payload?.query ?? '');

        const isGraphqlWsProtocol = !!query && !frame.isBinary;

        if (isGraphqlWsProtocol) {
          if (graphqlSubscriptionInput.type === 'connection_init') {
            sendGraphQLWsProtocolData(socket, {
              type: 'connection_ack'
            });
            return;
          }

          if (graphqlSubscriptionInput.type === 'ping') {
            sendGraphQLWsProtocolData(socket, {
              type: 'pong'
            });
            return;
          }

          if (graphqlSubscriptionInput.type !== 'subscribe') {
            console.warn(
              'Unsupported graphQL subscription input type',
              graphqlSubscriptionInput.type
            );
            return;
          }

          const matchedGraphQLWsProtocolRequestArtifacts = matchGraphQLWsProtocolRequestArtifacts({
            artifacts: graphqlWsRequestArtifacts,
            meta: {
              path: requestPathname,
              eventName: query.eventName,
              query: graphqlSubscriptionInput.payload?.query,
              operationType: query.operationType,
              operationName: query.operationName
            }
          });

          const matchedRouteConfig = matchedGraphQLWsProtocolRequestArtifacts.find(({ config }) => {
            if (!config.entities) return true;

            const entityEntries = Object.entries(config.entities) as Entries<
              Required<GraphQLEntitiesByEntityName>
            >;

            return entityEntries.every(([entityName, entityDescriptorOrValue]) => {
              const isEntityVariablesByTopLevelDescriptor =
                entityName === 'variables' && isEntityDescriptor(entityDescriptorOrValue);
              if (isEntityVariablesByTopLevelDescriptor) {
                const variablesDescriptor = entityDescriptorOrValue as EntityDescriptor;
                if (
                  variablesDescriptor.checkMode === 'exists' ||
                  variablesDescriptor.checkMode === 'notExists'
                ) {
                  return resolveEntityValues({
                    actualValue: graphqlSubscriptionInput.payload?.variables,
                    checkMode: variablesDescriptor.checkMode
                  });
                }

                return resolveEntityValues({
                  actualValue: graphqlSubscriptionInput.payload?.variables,
                  descriptorValue: variablesDescriptor.value,
                  checkMode: variablesDescriptor.checkMode,
                  oneOf: variablesDescriptor.oneOf ?? false
                });
              }

              const actualEntity = flatten<PlainObject, PlainObject>(
                entityName === 'variables'
                  ? (graphqlSubscriptionInput.payload?.variables ?? {})
                  : request[entityName]
              );
              const entityValueEntries = Object.entries(entityDescriptorOrValue) as Entries<
                Exclude<GraphQLEntity, TopLevelPlainEntityDescriptor>
              >;

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
          });

          if (!matchedRouteConfig) return;

          const entities = matchedRouteConfig.config.entities;
          const graphQLVariables = graphqlSubscriptionInput.payload?.variables;
          if (entities) {
            const entityEntries = Object.entries(entities) as Entries<Required<typeof entities>>;

            const isMatchedByEntities = entityEntries.every(
              ([entityName, entityDescriptorOrValue]) => {
                const isEntityVariablesByTopLevelDescriptor =
                  entityName === 'variables' && isEntityDescriptor(entityDescriptorOrValue);
                if (isEntityVariablesByTopLevelDescriptor) {
                  const variablesDescriptor = entityDescriptorOrValue as EntityDescriptor;
                  if (
                    variablesDescriptor.checkMode === 'exists' ||
                    variablesDescriptor.checkMode === 'notExists'
                  ) {
                    return resolveEntityValues({
                      actualValue: graphQLVariables,
                      checkMode: variablesDescriptor.checkMode
                    });
                  }

                  return resolveEntityValues({
                    actualValue: graphQLVariables,
                    descriptorValue: variablesDescriptor.value,
                    checkMode: variablesDescriptor.checkMode,
                    oneOf: variablesDescriptor.oneOf ?? false
                  });
                }

                const actualEntity = flatten<PlainObject, PlainObject>(
                  entityName === 'variables'
                    ? (graphqlSubscriptionInput.payload?.variables ?? {})
                    : {}
                );
                const entityValueEntries = Object.entries(entityDescriptorOrValue) as Entries<
                  Exclude<GraphQLEntity, TopLevelPlainEntityDescriptor>
                >;

                return entityValueEntries.every(
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
            );

            if (!isMatchedByEntities) return;
          }

          const params: GraphQLWsProtocolParams = {
            entities: matchedRouteConfig.config.entities ?? {},
            eventName: query.eventName,
            next: (payloadToSend) => {
              sendGraphQLWsProtocolData(socket, payloadToSend);
            },
            operationName: query.operationName,
            query: graphqlSubscriptionInput.payload?.query,
            raw,
            setDelay: async (delay) => {
              await sleep(delay === Infinity ? 99999999 : delay);
            },
            socket,
            variables: graphqlSubscriptionInput.payload?.variables ?? {}
          };

          const resolvedData =
            typeof matchedRouteConfig.config.data === 'function'
              ? await matchedRouteConfig.config.data(params)
              : matchedRouteConfig.config.data;

          if (matchedRouteConfig.config.settings?.delay) {
            await sleep(matchedRouteConfig.config.settings.delay);
          }

          sendGraphQLWsProtocolData(socket, resolvedData);
        }
      });
    }
  );
};
