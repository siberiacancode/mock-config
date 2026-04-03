import type { Express } from 'express';

import { flatten } from 'flat';

import type {
  EntityDescriptor,
  Entries,
  PlainObject,
  RestDataResponse,
  RestEntitiesByEntityName,
  RestEntity,
  RestParams,
  RestRequestArtifact,
  TopLevelPlainEntityArray,
  TopLevelPlainEntityDescriptor
} from '@/utils/types';

import {
  asyncHandler,
  callRequestInterceptor,
  callResponseInterceptors,
  convertToEntityDescriptor,
  isEntityDescriptor,
  resolveEntityValues,
  sleep,
  urlJoin
} from '@/utils/helpers';

interface CreateRestRoutesParams {
  restRequestArtifacts: RestRequestArtifact[];
  server: Express;
}

export const createRestRoute = ({ server, restRequestArtifacts }: CreateRestRoutesParams) =>
  server.use(
    asyncHandler(async (request, response, next) => {
      const requestMethod = request.method.toLowerCase();

      const matchedRequestArtifacts = restRequestArtifacts.filter((restRequestArtifact) => {
        const isMethodMatched = restRequestArtifact.method === requestMethod;
        if (!isMethodMatched) return false;

        if (restRequestArtifact.path instanceof RegExp) {
          return restRequestArtifact.path.test(request.path);
        }

        return request.path === urlJoin(restRequestArtifact.baseUrl, restRequestArtifact.path);
      });

      if (!matchedRequestArtifacts.length) return next();

      const matchedRouteConfig = matchedRequestArtifacts.find(({ config }) => {
        if (!config.entities) return true;

        const entityEntries = Object.entries(config.entities) as Entries<
          Required<RestEntitiesByEntityName>
        >;
        return entityEntries.every(([entityName, entityDescriptorOrValue]) => {
          // ✅ important:
          // check whole body as plain value strictly if descriptor used for body
          const isEntityBodyByTopLevelDescriptor =
            entityName === 'body' && isEntityDescriptor(entityDescriptorOrValue);
          if (isEntityBodyByTopLevelDescriptor) {
            const bodyDescriptor: EntityDescriptor = entityDescriptorOrValue;
            if (bodyDescriptor.checkMode === 'exists' || bodyDescriptor.checkMode === 'notExists') {
              return resolveEntityValues({
                actualValue: request.body,
                checkMode: bodyDescriptor.checkMode
              });
            }

            return resolveEntityValues({
              actualValue: request.body,
              descriptorValue: bodyDescriptor.value,
              checkMode: bodyDescriptor.checkMode,
              oneOf: bodyDescriptor.oneOf ?? false
            });
          }

          const isEntityBodyByTopLevelArray =
            entityName === 'body' && Array.isArray(entityDescriptorOrValue);
          if (isEntityBodyByTopLevelArray) {
            if (!Array.isArray(request.body)) return false;

            return resolveEntityValues({
              actualValue: request.body,
              descriptorValue: entityDescriptorOrValue,
              checkMode: 'equals'
            });
          }

          const actualEntity = flatten<PlainObject, PlainObject>(request[entityName]);
          const entityValueEntries = Object.entries(entityDescriptorOrValue) as Entries<
            Exclude<RestEntity, TopLevelPlainEntityArray | TopLevelPlainEntityDescriptor>
          >;
          return entityValueEntries.every(
            ([entityPropertyKey, entityPropertyDescriptorOrValue]) => {
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

      let matchedRouteConfigData: RestDataResponse | undefined;

      if (matchedRouteConfig.config.settings?.polling && 'queue' in matchedRouteConfig.config) {
        if (!matchedRouteConfig.config.queue.length) return next();

        const shallowMatchedRouteConfig =
          matchedRouteConfig as unknown as typeof matchedRouteConfig & {
            __pollingIndex: number;
            __timeoutInProgress: boolean;
          };

        let index = shallowMatchedRouteConfig.__pollingIndex ?? 0;
        const { time } = matchedRouteConfig.config.queue[index];

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
        const queueItem = matchedRouteConfig.config.queue[index];

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

        if ('data' in queueItem) {
          matchedRouteConfigData = queueItem.data;
        }
      }

      if ('data' in matchedRouteConfig.config) {
        matchedRouteConfigData = matchedRouteConfig.config.data;
      }

      if (matchedRouteConfig.config.settings?.status) {
        response.statusCode = matchedRouteConfig.config.settings.status;
      }

      // ✅ important:
      // set 'Cache-Control' header for explicit browsers response revalidate: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
      // this code should place before response interceptors for giving opportunity to rewrite 'Cache-Control' header
      if (request.method === 'GET') response.set('Cache-control', 'no-cache');

      const params: RestParams = {
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

      if (response.headersSent) {
        return;
      }

      const data = await callResponseInterceptors({
        data: resolvedData,
        request,
        response,
        interceptors: {
          routeInterceptor: matchedRouteConfig.routeResponseInterceptor,
          requestInterceptor: matchedRouteConfig.requestResponseInterceptor,
          componentInterceptor: matchedRouteConfig.componentResponseInterceptor,
          serverInterceptor: matchedRouteConfig.serverResponseInterceptor
        }
      });

      if (matchedRouteConfig.config.settings?.delay) {
        await sleep(matchedRouteConfig.config.settings.delay);
      }

      if (response.headersSent) {
        return;
      }

      if (response.getHeader('content-type')) {
        return response.send(data);
      }

      return response.json(data);
    })
  );
