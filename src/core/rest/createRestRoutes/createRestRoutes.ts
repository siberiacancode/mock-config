import type { IRouter } from 'express';

import { flatten } from 'flat';
import fs from 'node:fs';
import path from 'node:path';

import type {
  EntityDescriptor,
  Entries,
  Interceptors,
  PlainObject,
  RestConfig,
  RestDataResponse,
  RestEntitiesByEntityName,
  RestEntity,
  RestFileResponse,
  TopLevelPlainEntityArray,
  TopLevelPlainEntityDescriptor
} from '@/utils/types';

import { callRequestInterceptor, callResponseInterceptors } from '@/core/interceptors';
import {
  asyncHandler,
  convertToEntityDescriptor,
  isEntityDescriptor,
  isFileDescriptor,
  isFilePathValid,
  resolveEntityValues,
  sleep
} from '@/utils/helpers';

import { prepareRestRequestConfigs } from './helpers';

interface CreateRestRoutesParams {
  restConfig: RestConfig;
  router: IRouter;
  serverResponseInterceptor?: Interceptors<'rest'>['response'];
}

export const createRestRoutes = ({
  router,
  restConfig,
  serverResponseInterceptor
}: CreateRestRoutesParams) => {
  prepareRestRequestConfigs(restConfig.configs).forEach((requestConfig) => {
    router.route(requestConfig.path)[requestConfig.method](
      asyncHandler(async (request, response, next) => {
        if (requestConfig.interceptors?.request) {
          await callRequestInterceptor({
            request,
            interceptor: requestConfig.interceptors.request
          });
        }

        const matchedRouteConfig = requestConfig.routes.find(({ entities }) => {
          if (!entities) return true;

          const entityEntries = Object.entries(entities) as Entries<
            Required<RestEntitiesByEntityName>
          >;
          return entityEntries.every(([entityName, entityDescriptorOrValue]) => {
            // ✅ important:
            // check whole body as plain value strictly if descriptor used for body
            const isEntityBodyByTopLevelDescriptor =
              entityName === 'body' && isEntityDescriptor(entityDescriptorOrValue);
            if (isEntityBodyByTopLevelDescriptor) {
              const bodyDescriptor: EntityDescriptor = entityDescriptorOrValue;
              if (
                bodyDescriptor.checkMode === 'exists' ||
                bodyDescriptor.checkMode === 'notExists'
              ) {
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

        if (matchedRouteConfig.interceptors?.request) {
          await callRequestInterceptor({
            request,
            interceptor: matchedRouteConfig.interceptors.request
          });
        }

        const matchedRouteConfigDataDescriptor = {} as {
          data?: RestDataResponse;
          file?: RestFileResponse;
        };

        if (matchedRouteConfig.settings?.polling && 'queue' in matchedRouteConfig) {
          if (!matchedRouteConfig.queue.length) return next();

          const shallowMatchedRouteConfig =
            matchedRouteConfig as unknown as typeof matchedRouteConfig & {
              __pollingIndex: number;
              __timeoutInProgress: boolean;
            };

          let index = shallowMatchedRouteConfig.__pollingIndex ?? 0;
          const { time } = matchedRouteConfig.queue[index];

          const updateIndex = () => {
            if (matchedRouteConfig.queue.length - 1 === index) {
              index = 0;
            } else {
              index += 1;
            }
            shallowMatchedRouteConfig.__pollingIndex = index;
          };
          const queueItem = matchedRouteConfig.queue[index];

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
            matchedRouteConfigDataDescriptor.data = queueItem.data;
          }
          if ('file' in queueItem) {
            if (!isFilePathValid(queueItem.file)) return next();
            matchedRouteConfigDataDescriptor.file = queueItem.file;
          }
        }

        if ('data' in matchedRouteConfig) {
          matchedRouteConfigDataDescriptor.data = matchedRouteConfig.data;
        }
        if ('file' in matchedRouteConfig) {
          if (!isFilePathValid(matchedRouteConfig.file)) return next();
          matchedRouteConfigDataDescriptor.file = matchedRouteConfig.file;
        }

        if (matchedRouteConfig.settings?.status) {
          response.statusCode = matchedRouteConfig.settings.status;
        }

        // ✅ important:
        // set 'Cache-Control' header for explicit browsers response revalidate: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
        // this code should place before response interceptors for giving opportunity to rewrite 'Cache-Control' header
        if (request.method === 'GET') response.set('Cache-control', 'no-cache');

        let resolvedData = null;

        if (matchedRouteConfigDataDescriptor.data) {
          resolvedData =
            typeof matchedRouteConfigDataDescriptor.data === 'function'
              ? await matchedRouteConfigDataDescriptor.data(
                  request,
                  matchedRouteConfig.entities ?? {}
                )
              : matchedRouteConfigDataDescriptor.data;
        }
        if (matchedRouteConfigDataDescriptor.file) {
          const buffer = fs.readFileSync(path.resolve(matchedRouteConfigDataDescriptor.file));
          resolvedData = {
            path: matchedRouteConfigDataDescriptor.file,
            file: buffer
          };
        }

        const data = await callResponseInterceptors({
          data: resolvedData,
          request,
          response,
          interceptors: {
            routeInterceptor: matchedRouteConfig.interceptors?.response,
            requestInterceptor: requestConfig.interceptors?.response,
            apiInterceptor: restConfig.interceptors?.response,
            serverInterceptor: serverResponseInterceptor
          }
        });

        if (matchedRouteConfig.settings?.delay) {
          await sleep(matchedRouteConfig.settings.delay);
        }

        if (isFileDescriptor(data)) {
          const isFilePathChanged = matchedRouteConfigDataDescriptor.file !== data.path;
          if (isFilePathChanged) {
            if (!isFilePathValid(data.path)) return next();
            data.file = fs.readFileSync(path.resolve(data.path));
          }
          // ✅ important: replace backslashes because windows can use them in file path
          const fileName = data.path.replaceAll('\\', '/').split('/').at(-1)!;
          const fileExtension = fileName.split('.').at(-1)!;
          response.type(fileExtension);
          response.set('Content-Disposition', `filename=${fileName}`);
          return response.send(data.file);
        }
        response.json(data);
      })
    );
  });

  return router;
};
