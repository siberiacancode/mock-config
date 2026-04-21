import type { Express } from 'express';

import type {
  Entries,
  RestEntitiesByEntityName,
  RestParams,
  RestRequestArtifact
} from '@/utils/types';

import {
  asyncHandler,
  callRequestInterceptor,
  callResponseInterceptors,
  isComparator,
  normalizeUrl,
  resolveEntityValues,
  sleep,
  urlJoin
} from '@/utils/helpers';

import { equals } from '../../entities';
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

      request.queries = request.query;

      const previousParams = { ...request.params };

      const matchedRequestArtifacts = matchRestRequestArtifacts({
        artifacts: restRequestArtifacts,
        meta: {
          method: requestMethod,
          path: normalizeUrl(request.path)
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
        return entityEntries.every(([entityName, valueOrComparator]) => {
          const actualEntity = request[entityName];

          if (isComparator(valueOrComparator)) {
            const comparator = valueOrComparator;
            return resolveEntityValues({ actual: actualEntity, comparator });
          }

          const isBody = entityName === 'body';
          if (isBody) {
            const comparator = equals(valueOrComparator);
            return resolveEntityValues({ actual: actualEntity, comparator });
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

      if (matchedRouteConfig.config.settings?.status) {
        response.statusCode = matchedRouteConfig.config.settings.status;
      }

      // ✅ important:
      // set 'Cache-Control' header for explicit browsers response revalidate: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
      // this code should place before response interceptors for giving opportunity to rewrite 'Cache-Control' header
      if (request.method === 'GET') response.set('Cache-control', 'no-store');

      const params: RestParams = {
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
