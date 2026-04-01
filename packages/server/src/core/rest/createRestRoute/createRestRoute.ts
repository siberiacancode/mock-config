import type { Express } from 'express';

import { flatten } from 'flat';
import fs from 'node:fs';
import path from 'node:path';

import type {
  EntityDescriptor,
  Entries,
  PlainObject,
  RestDataResponse,
  RestEntitiesByEntityName,
  RestEntity,
  RestFileResponse,
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
  isFileDescriptor,
  isFilePathValid,
  resolveEntityValues,
  sleep,
  urlJoin
} from '@/utils/helpers';

import { generatePathRegex, matchRestRequestArtifacts } from './helpers';

interface CreateRestRoutesParams {
  restRequestArtifacts: RestRequestArtifact[];
  server: Express;
}

const extractPathParams = (artifact: RestRequestArtifact, path: string) => {
  if (artifact.path instanceof RegExp) return {};

  const fullPath = urlJoin(artifact.baseUrl, artifact.path);
  const keys = fullPath.match(/:[^/]+/g)?.map((key) => key.slice(1)) ?? [];

  if (!keys.length) return {};

  const match = path.match(generatePathRegex(fullPath));
  if (!match) return {};

  return keys.reduce<Record<string, string>>((acc, key, index) => {
    acc[key] = decodeURIComponent(match[index + 1]);
    return acc;
  }, {});
};

export const createRestRoute = ({ server, restRequestArtifacts }: CreateRestRoutesParams) =>
  server.use(
    asyncHandler(async (request, response, next) => {
      const requestMethod = request.method.toLowerCase();
      const previousParams = { ...request.params };

      const matchedRequestArtifacts = matchRestRequestArtifacts({
        artifacts: restRequestArtifacts,
        meta: {
          method: requestMethod,
          path: request.path
        }
      });

      if (!matchedRequestArtifacts.length) return next();

      const matchedRouteConfig = matchedRequestArtifacts.find((artifact) => {
        request.params = extractPathParams(artifact, request.path);
        const { config } = artifact;

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

      if (!matchedRouteConfig) {
        request.params = previousParams;
        return next();
      }

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

      const matchedRouteConfigDataDescriptor = {} as {
        data?: RestDataResponse;
        file?: RestFileResponse;
      };

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
          matchedRouteConfigDataDescriptor.data = queueItem.data;
        }
        if ('file' in queueItem) {
          if (!isFilePathValid(queueItem.file)) return next();
          matchedRouteConfigDataDescriptor.file = queueItem.file;
        }
      }

      if ('data' in matchedRouteConfig.config) {
        matchedRouteConfigDataDescriptor.data = matchedRouteConfig.config.data;
      }
      if ('file' in matchedRouteConfig.config) {
        if (!isFilePathValid(matchedRouteConfig.config.file)) return next();
        matchedRouteConfigDataDescriptor.file = matchedRouteConfig.config.file;
      }

      if (matchedRouteConfig.config.settings?.status) {
        response.statusCode = matchedRouteConfig.config.settings.status;
      }

      // ✅ important:
      // set 'Cache-Control' header for explicit browsers response revalidate: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
      // this code should place before response interceptors for giving opportunity to rewrite 'Cache-Control' header
      if (request.method === 'GET') response.set('Cache-control', 'no-cache');

      let resolvedData = null;

      if (matchedRouteConfigDataDescriptor.data) {
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

        resolvedData =
          typeof matchedRouteConfigDataDescriptor.data === 'function'
            ? await matchedRouteConfigDataDescriptor.data(params)
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
          routeInterceptor: matchedRouteConfig.routeResponseInterceptor,
          requestInterceptor: matchedRouteConfig.requestResponseInterceptor,
          componentInterceptor: matchedRouteConfig.componentResponseInterceptor,
          serverInterceptor: matchedRouteConfig.serverResponseInterceptor
        }
      });

      if (matchedRouteConfig.config.settings?.delay) {
        await sleep(matchedRouteConfig.config.settings.delay);
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
