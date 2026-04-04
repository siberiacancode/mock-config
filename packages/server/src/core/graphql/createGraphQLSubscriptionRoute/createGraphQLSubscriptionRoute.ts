import type { IncomingMessage } from 'node:http';
import type { RawData, WebSocket } from 'ws';

import { flatten } from 'flat';
import { WebSocketServer } from 'ws';

import type {
  EntityDescriptor,
  Entries,
  GraphQLEntity,
  GraphQLSubscriptionEntitiesByEntityName,
  GraphQLSubscriptionParams,
  GraphQLSubscriptionRequestArtifact,
  PlainObject,
  RegisterWebSocketUpgradeHandler,
  TopLevelPlainEntityDescriptor
} from '@/utils/types';

import {
  convertToEntityDescriptor,
  getGraphQLSubscriptionInput,
  isEntityDescriptor,
  normalizeUrl,
  parseQuery,
  resolveEntityValues,
  sleep,
  urlJoin
} from '@/utils/helpers';

import { matchGraphQLSubscriptionRequestArtifacts } from './helpers/matchGraphQLSubscriptionRequestArtifacts/matchGraphQLSubscriptionRequestArtifacts';

interface CreateGraphQLSubscriptionRouteParams {
  graphQLSubscriptionRequestArtifacts: GraphQLSubscriptionRequestArtifact[];
  registerWebSocketUpgradeHandler: RegisterWebSocketUpgradeHandler;
}

const getPathnameFromUpgradeRequest = (upgradeRequest: IncomingMessage) => {
  const raw = upgradeRequest.url ?? '/';
  const pathname = raw.split('?')[0] || '/';
  return normalizeUrl(pathname);
};

const matchSubscriptionEntities = (
  entities: GraphQLSubscriptionEntitiesByEntityName | undefined,
  graphQLVariables: PlainObject | undefined
): boolean => {
  if (!entities?.variables) return true;

  const entityDescriptorOrValue = entities.variables;

  if (isEntityDescriptor(entityDescriptorOrValue)) {
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

  const actualEntity = flatten<PlainObject, PlainObject>(graphQLVariables!);
  const entityValueEntries = Object.entries(entityDescriptorOrValue) as Entries<
    Exclude<GraphQLEntity, TopLevelPlainEntityDescriptor>
  >;

  return entityValueEntries.every(([entityPropertyKey, entityPropertyDescriptorOrValue]) => {
    const entityPropertyDescriptor = convertToEntityDescriptor(entityPropertyDescriptorOrValue);

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
  });
};

const sendGraphQLSubscriptionData = (socket: WebSocket, data: unknown) => {
  if (data === undefined) return;
  socket.send(typeof data === 'string' ? data : JSON.stringify(data));
};

export const createGraphQLSubscriptionRoute = ({
  registerWebSocketUpgradeHandler,
  graphQLSubscriptionRequestArtifacts
}: CreateGraphQLSubscriptionRouteParams) => {
  const wsServer = new WebSocketServer({
    noServer: true
  });

  const subscriptionBaseUrls = new Set(
    graphQLSubscriptionRequestArtifacts.map((artifact) => urlJoin('/', artifact.baseUrl))
  );

  registerWebSocketUpgradeHandler((request, socket, head) => {
    const pathname = request.url ?? '/';
    const shouldHandleUpgrade = subscriptionBaseUrls.has(urlJoin('/', pathname));
    if (!shouldHandleUpgrade) {
      return false;
    }

    wsServer.handleUpgrade(request, socket, head, (upgradedSocket) => {
      wsServer.emit('connection', upgradedSocket, request);
    });

    return true;
  });

  wsServer.on('connection', (socket, upgradeRequest) => {
    socket.on('message', async (raw: RawData) => {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const graphQLInput = getGraphQLSubscriptionInput(payload);
      if (!graphQLInput.query) return;

      const query = parseQuery(graphQLInput.query);
      if (!query) {
        return;
      }

      if (query.operationType !== 'subscription') {
        return;
      }

      if (!upgradeRequest) {
        return;
      }

      const path = getPathnameFromUpgradeRequest(upgradeRequest);

      const matchedRequestArtifacts = matchGraphQLSubscriptionRequestArtifacts({
        artifacts: graphQLSubscriptionRequestArtifacts,
        meta: {
          path,
          query: graphQLInput.query,
          operationType: query.operationType,
          operationName: query.operationName
        }
      });

      if (!matchedRequestArtifacts.length) {
        return;
      }

      const matchedRouteConfig = matchedRequestArtifacts.find(({ config }) =>
        matchSubscriptionEntities(config.entities, graphQLInput.variables)
      );

      if (!matchedRouteConfig) {
        return;
      }

      const entities = matchedRouteConfig.config.entities ?? {};

      const params: GraphQLSubscriptionParams = {
        entities,
        next: (payload) => {
          sendGraphQLSubscriptionData(socket, payload);
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

      // if (matchedRouteConfig.requestRequestInterceptor) {
      //   await matchedRouteConfig.requestRequestInterceptor(params);
      // }

      // if (matchedRouteConfig.componentRequestInterceptor) {
      //   await matchedRouteConfig.componentRequestInterceptor(params);
      // }

      const resolvedData =
        typeof matchedRouteConfig.config.data === 'function'
          ? await matchedRouteConfig.config.data(params)
          : matchedRouteConfig.config.data;

      const data = resolvedData;

      // if (matchedRouteConfig.componentResponseInterceptor) {
      //   data = matchedRouteConfig.componentResponseInterceptor(data, params);
      // }

      // if (matchedRouteConfig.requestResponseInterceptor) {
      //   data = matchedRouteConfig.requestResponseInterceptor(data, params);
      // }

      if (matchedRouteConfig.config.settings?.delay) {
        await sleep(matchedRouteConfig.config.settings.delay);
      }

      if (!data) return;
      sendGraphQLSubscriptionData(socket, data);
    });
  });
};
