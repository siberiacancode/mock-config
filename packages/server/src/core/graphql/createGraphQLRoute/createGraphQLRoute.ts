import type { Express } from 'express';

import { flatten } from 'flat';

import type {
  EntityDescriptor,
  Entries,
  GraphQLEntitiesByEntityName,
  GraphQLEntity,
  GraphQLParams,
  GraphQLRequestArtifact,
  PlainObject,
  TopLevelPlainEntityDescriptor
} from '@/utils/types';

import {
  asyncHandler,
  callRequestInterceptor,
  callResponseInterceptors,
  convertToEntityDescriptor,
  getGraphQLInput,
  isEntityDescriptor,
  normalizeUrl,
  parseGraphQLQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

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
                actualValue: graphQLInput.variables,
                checkMode: variablesDescriptor.checkMode
              });
            }

            return resolveEntityValues({
              actualValue: graphQLInput.variables,
              descriptorValue: variablesDescriptor.value,
              checkMode: variablesDescriptor.checkMode,
              oneOf: variablesDescriptor.oneOf ?? false
            });
          }

          const actualEntity = flatten<PlainObject, PlainObject>(
            entityName === 'variables' ? graphQLInput.variables : request[entityName]
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
        emit: (payload) => {
          request.context.emit(payload);
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
