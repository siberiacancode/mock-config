import type { IRouter, NextFunction, Request, Response } from 'express';

import { flatten } from 'flat';

import type {
  EntityDescriptor,
  Entries,
  GraphqlConfig,
  GraphQLEntitiesByEntityName,
  GraphQLEntity,
  Interceptors,
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
  parseQuery,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { prepareGraphQLRequestConfigs } from './helpers';

interface CreateGraphQLRoutesParams {
  graphqlConfig: GraphqlConfig;
  router: IRouter;
  serverResponseInterceptor?: Interceptors<'graphql'>['response'];
}

export const createGraphQLRoutes = ({
  router,
  graphqlConfig,
  serverResponseInterceptor
}: CreateGraphQLRoutesParams) => {
  const preparedGraphQLRequestConfig = prepareGraphQLRequestConfigs(graphqlConfig.configs);

  const graphqlMiddleware = async (request: Request, response: Response, next: NextFunction) => {
    const graphQLInput = getGraphQLInput(request);
    if (!graphQLInput.query) {
      return response
        .status(400)
        .json({ message: 'Query is missing, you must pass a valid GraphQL query' });
    }

    const query = parseQuery(graphQLInput.query);
    if (!query) {
      return response
        .status(400)
        .json({ message: 'Query is invalid, you must use a valid GraphQL query' });
    }

    const matchedRequestConfig = preparedGraphQLRequestConfig.find((requestConfig) => {
      if (requestConfig.operationType !== query.operationType) return false;

      if (
        'query' in requestConfig &&
        requestConfig.query.replace(/\s+/g, '') !== graphQLInput.query?.replace(/\s+/g, '')
      )
        return false;

      if ('operationName' in requestConfig) {
        if (!query.operationName) return false;

        return requestConfig.operationName instanceof RegExp
          ? new RegExp(requestConfig.operationName).test(query.operationName)
          : requestConfig.operationName === query.operationName;
      }

      return true;
    });

    if (!matchedRequestConfig) {
      return next();
    }

    if (matchedRequestConfig.interceptors?.request) {
      await callRequestInterceptor({
        request,
        interceptor: matchedRequestConfig.interceptors.request
      });
    }

    const matchedRouteConfig = matchedRequestConfig.routes.find(({ entities }) => {
      if (!entities) return true;

      const entityEntries = Object.entries(entities) as Entries<
        Required<GraphQLEntitiesByEntityName>
      >;
      return entityEntries.every(([entityName, entityDescriptorOrValue]) => {
        // ✅ important:
        // check whole variables as plain value strictly if descriptor used for variables
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
        return entityValueEntries.every(([entityPropertyKey, entityPropertyDescriptorOrValue]) => {
          const entityPropertyDescriptor = convertToEntityDescriptor(
            entityPropertyDescriptorOrValue
          );

          // ✅ important: transform header keys to lower case because browsers send headers in lowercase
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
        });
      });
    });

    if (!matchedRouteConfig) return next();

    if (matchedRouteConfig.interceptors?.request) {
      await callRequestInterceptor({
        request,
        interceptor: matchedRouteConfig.interceptors.request
      });
    }

    let matchedRouteConfigData = null;
    if (matchedRouteConfig.settings?.polling && 'queue' in matchedRouteConfig) {
      if (!matchedRouteConfig.queue.length) return next();

      const shallowMatchedRouteConfig =
        matchedRouteConfig as unknown as typeof matchedRouteConfig & {
          __pollingIndex: number;
          __timeoutInProgress: boolean;
        };

      let index = shallowMatchedRouteConfig.__pollingIndex ?? 0;

      const { time, data } = matchedRouteConfig.queue[index];

      const updateIndex = () => {
        if (matchedRouteConfig.queue.length - 1 === index) {
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

    if ('data' in matchedRouteConfig) {
      matchedRouteConfigData = matchedRouteConfig.data;
    }

    const resolvedData =
      typeof matchedRouteConfigData === 'function'
        ? await matchedRouteConfigData(request, matchedRouteConfig.entities ?? {})
        : matchedRouteConfigData;

    if (matchedRouteConfig.settings?.status) {
      response.statusCode = matchedRouteConfig.settings.status;
    }

    // ✅ important:
    // set 'Cache-Control' header for explicit browsers response revalidate: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
    // this code should place before response interceptors for giving opportunity to rewrite 'Cache-Control' header
    if (matchedRequestConfig.operationType === 'query') response.set('Cache-control', 'no-cache');

    const data = await callResponseInterceptors({
      data: resolvedData,
      request,
      response,
      interceptors: {
        routeInterceptor: matchedRouteConfig.interceptors?.response,
        requestInterceptor: matchedRequestConfig.interceptors?.response,
        apiInterceptor: graphqlConfig.interceptors?.response,
        serverInterceptor: serverResponseInterceptor
      }
    });

    if (matchedRouteConfig.settings?.delay) {
      await sleep(matchedRouteConfig.settings.delay);
    }

    return response.json(data);
  };

  router.route('/').get(asyncHandler(graphqlMiddleware));
  router.route('/').post(asyncHandler(graphqlMiddleware));

  return router;
};
