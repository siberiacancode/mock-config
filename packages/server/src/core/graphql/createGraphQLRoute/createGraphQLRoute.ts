import type { Express } from 'express';

import type {
  Entries,
  GraphQLEntitiesByEntityName,
  GraphQLParams,
  GraphQLRequestArtifact
} from '@/utils/types';

import {
  asyncHandler,
  callRequestInterceptor,
  callResponseInterceptors,
  getGraphQLInput,
  isComparator,
  normalizeUrl,
  parseGraphQLQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { equals } from '../../entities';
import { matchGraphQLRequestArtifacts } from './helpers';

interface CreateGraphQLRouteParams {
  graphQLRequestArtifacts: GraphQLRequestArtifact[];
  server: Express;
}

export const createGraphQLRoute = ({ server, graphQLRequestArtifacts }: CreateGraphQLRouteParams) =>
  server.use(
    asyncHandler(async (request, response, next) => {
      if (request.method !== 'GET' && request.method !== 'POST') return next();

      const graphQLInput = getGraphQLInput(request);
      if (!graphQLInput.query) return next();

      const query = parseGraphQLQuery(graphQLInput.query);
      if (!query) return next();

      request.queries = request.query;

      const matchedRequestArtifacts = matchGraphQLRequestArtifacts({
        artifacts: graphQLRequestArtifacts,
        meta: {
          path: normalizeUrl(request.path),
          query: graphQLInput.query,
          operationType: query.operationType,
          operationName: query.operationName
        }
      });

      if (!matchedRequestArtifacts.length) return next();

      const matchedRouteConfig = matchedRequestArtifacts.find(({ config }) => {
        if (!config.entities) return true;

        const entityEntries = Object.entries(config.entities) as Entries<
          Required<GraphQLEntitiesByEntityName>
        >;

        return entityEntries.every(([entityName, valueOrComparator]) => {
          const actualEntity =
            entityName === 'variables' ? graphQLInput.variables : request[entityName];

          if (isComparator(valueOrComparator)) {
            const comparator = valueOrComparator;
            return resolveEntityValues({ actual: actualEntity, comparator });
          }

          const isVariables = entityName === 'variables';
          if (isVariables) {
            const comparator = equals(valueOrComparator);
            return resolveEntityValues({ actual: graphQLInput.variables, comparator });
          }

          const mappedEntityEntries = Object.entries(valueOrComparator) as Entries<
            typeof valueOrComparator
          >;
          return mappedEntityEntries.every(([entityPropertyKey, valueOrComparator]) => {
            // ✅ important:
            // transform header keys to lower case
            // because browsers send headers in lowercase
            const actualPropertyKey =
              entityName === 'headers' && typeof entityPropertyKey === 'string'
                ? entityPropertyKey.toLowerCase()
                : entityPropertyKey;
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
      });

      if (!matchedRouteConfig) return next();

      if (matchedRouteConfig.componentRequestInterceptor) {
        await callRequestInterceptor({
          request,
          interceptor: matchedRouteConfig.componentRequestInterceptor
        });
      }

      if (matchedRouteConfig.requestRequestInterceptor) {
        await callRequestInterceptor({
          request,
          interceptor: matchedRouteConfig.requestRequestInterceptor
        });
      }

      if (matchedRouteConfig.routeRequestInterceptor) {
        await callRequestInterceptor({
          request,
          interceptor: matchedRouteConfig.routeRequestInterceptor
        });
      }

      const params: GraphQLParams = {
        request,
        response,
        next,
        entities: matchedRouteConfig.config.entities ?? {},
        broadcast: (payload) => {
          request.context.broadcast(payload);
        },
        appendHeader: (field, value) => {
          response.append(field, value);
        },
        attachment: (filename) => {
          response.attachment(filename);
        },
        clearCookie: (name, options) => {
          response.clearCookie(name, options);
        },
        getCookie: (name) => request.cookies[name],
        getRequestHeader: (field) => request.headers[field],
        getRequestHeaders: () => request.headers,
        getResponseHeader: (field) => response.getHeader(field),
        getResponseHeaders: () => response.getHeaders(),
        setCookie: (name, value, options) => {
          if (options) {
            response.cookie(name, value, options);
            return;
          }
          response.cookie(name, value);
        },
        setDelay: async (delay) => {
          await sleep(delay === Infinity ? 99999999 : delay);
        },
        setHeader: (field, value) => {
          response.set(field, value);
        },
        setStatusCode: (statusCode) => {
          response.statusCode = statusCode;
        }
      };

      const resolvedData =
        typeof matchedRouteConfig.config.data === 'function'
          ? await matchedRouteConfig.config.data(params)
          : matchedRouteConfig.config.data;

      if (response.headersSent) {
        return;
      }

      if (matchedRouteConfig.config.settings?.status) {
        response.statusCode = matchedRouteConfig.config.settings.status;
      }

      if (matchedRouteConfig.operationType === 'query') {
        response.set('Cache-control', 'no-cache');
      }

      const data = await callResponseInterceptors({
        data: resolvedData,
        request,
        response,
        interceptors: {
          routeInterceptor: matchedRouteConfig.routeResponseInterceptor,
          componentInterceptor: matchedRouteConfig.componentResponseInterceptor,
          requestInterceptor: matchedRouteConfig.requestResponseInterceptor,
          serverInterceptor: matchedRouteConfig.serverResponseInterceptor
        }
      });

      if (matchedRouteConfig.config.settings?.delay) {
        await sleep(matchedRouteConfig.config.settings.delay);
      }

      if (response.headersSent) {
        return;
      }

      return response.json(data);
    })
  );
