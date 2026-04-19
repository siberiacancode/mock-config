import type { Express } from 'express';

import { flatten } from 'flat';

import type {
  Entries,
  GraphQLEntitiesByEntityName,
  GraphQLParams,
  GraphQLRequestArtifact,
  PlainObject
} from '@/utils/types';

import {
  asyncHandler,
  callRequestInterceptor,
  callResponseInterceptors,
  getGraphQLInput,
  isComparator,
  parseQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { equals } from '../../entities';

interface CreateGraphQLRouteParams {
  graphQLRequestArtifacts: GraphQLRequestArtifact[];
  server: Express;
}

export const createGraphQLRoute = ({ server, graphQLRequestArtifacts }: CreateGraphQLRouteParams) =>
  server.use(
    asyncHandler(async (request, response, next) => {
      if (request.method !== 'GET' && request.method !== 'POST') return next();

      const graphQLInput = getGraphQLInput(request);
      if (!graphQLInput.query) {
        return response.status(400).json({
          message: 'Query is missing, you must pass a valid GraphQL query'
        });
      }

      const query = parseQuery(graphQLInput.query);
      if (!query) {
        return response.status(400).json({
          message: 'Query is invalid, you must use a valid GraphQL query'
        });
      }

      request.queries = request.query;

      const matchedRequestArtifacts = graphQLRequestArtifacts.filter((artifact) => {
        if (artifact.operationType !== query.operationType) return false;

        if (artifact.query) {
          return artifact.query.replace(/\s+/g, '') === graphQLInput.query?.replace(/\s+/g, '');
        }

        if (artifact.operationName) {
          if (!query.operationName) return false;
          return artifact.operationName instanceof RegExp
            ? new RegExp(artifact.operationName).test(query.operationName)
            : artifact.operationName === query.operationName;
        }

        return true;
      });

      if (!matchedRequestArtifacts.length) return next();

      const matchedRouteConfig = matchedRequestArtifacts.find(({ config }) => {
        if (!config.entities) return true;

        const entityEntries = Object.entries(config.entities) as Entries<
          Required<GraphQLEntitiesByEntityName>
        >;

        return entityEntries.every(([entityName, valueOrComparator]) => {
          const actualEntity = flatten<PlainObject, PlainObject>(
            entityName === 'variables' ? graphQLInput.variables : request[entityName]
          );
          if (isComparator(valueOrComparator)) {
            const comparator = valueOrComparator;
            return resolveEntityValues({ actual: actualEntity, comparator });
          }

          const isVariables = entityName === 'variables';
          if (isVariables) {
            const comparator = equals(valueOrComparator);
            return resolveEntityValues({ actual: graphQLInput.variables, comparator });
          }
          const mappedEntityEntries = Object.entries(valueOrComparator);
          return mappedEntityEntries.every(([entityPropertyKey, valueOrComparator]) => {
            // ✅ important:
            // transform header keys to lower case
            // because browsers send headers in lowercase
            const actualPropertyKey =
              entityName === 'headers' ? entityPropertyKey.toLowerCase() : entityPropertyKey;
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

      let matchedRouteConfigData = null;
      if (matchedRouteConfig.config.settings?.polling && 'queue' in matchedRouteConfig.config) {
        if (!matchedRouteConfig.config.queue.length) return next();

        const shallowMatchedRouteConfig =
          matchedRouteConfig as unknown as typeof matchedRouteConfig & {
            __pollingIndex: number;
            __timeoutInProgress: boolean;
          };

        let index = shallowMatchedRouteConfig.__pollingIndex ?? 0;
        const { time, data } = matchedRouteConfig.config.queue[index];

        const updateIndex = () => {
          if (
            'queue' in matchedRouteConfig.config &&
            matchedRouteConfig.config.queue.length - 1 === index
          ) {
            index = 0;
          } else {
            index += 1;
          }
          shallowMatchedRouteConfig.__pollingIndex = index;
        };

        if (time && !shallowMatchedRouteConfig.__timeoutInProgress) {
          shallowMatchedRouteConfig.__timeoutInProgress = true;
          setTimeout(() => {
            shallowMatchedRouteConfig.__timeoutInProgress = false;
            updateIndex();
          }, time);
        }

        if (!time && !shallowMatchedRouteConfig.__timeoutInProgress) {
          updateIndex();
        }

        matchedRouteConfigData = data;
      }

      if ('data' in matchedRouteConfig.config) {
        matchedRouteConfigData = matchedRouteConfig.config.data;
      }

      const params: GraphQLParams = {
        request,
        response,
        entities: matchedRouteConfig.config.entities ?? {},
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
        typeof matchedRouteConfigData === 'function'
          ? await matchedRouteConfigData(params)
          : matchedRouteConfigData;

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

      return response.json(data);
    })
  );
