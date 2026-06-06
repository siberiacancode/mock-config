import { serialize } from 'cookie';

import type { Entries, RestEntitiesByEntityName, RestMethod } from '@/utils/types';

import { generatePathRegex, matchRestRequestArtifacts } from '@/core/rest';
import { isComparator, normalizeUrl, resolveEntityValues, sleep, urlJoin } from '@/utils/helpers';

import type { NativeRestParams, NativeRestRequestArtifact } from '../../types';
import type { ResponseInterceptorsState } from '../interceptors';

import { equals } from '../../../../core/entities';
import { callRequestInterceptor, callResponseInterceptors } from '../interceptors';
import { next } from './next';

interface CreateRestRoutesParams {
  restRequestArtifacts: NativeRestRequestArtifact[];
}

export interface RestRouteHandler {
  (request: MockServerRequest): Promise<Response>;
}

interface CopyResponseWithParams {
  body?: BodyInit | null;
  headers?: HeadersInit;
  status?: number;
}

const copyResponseWith = (
  originalResponse: Response,
  { body, status, headers }: CopyResponseWithParams = {}
) =>
  new Response(body ?? originalResponse.body, {
    status: status ?? originalResponse.status,
    headers: new Headers(headers ?? originalResponse.headers)
  });

const extractPathParams = (artifact: NativeRestRequestArtifact, path: string) => {
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

export const createRestRoute =
  ({ restRequestArtifacts }: CreateRestRoutesParams): RestRouteHandler =>
  async (request) => {
    const requestMethod = request.method.toLowerCase() as RestMethod;
    const requestPath = new URL(request.url).pathname;

    const matchedRequestArtifacts = matchRestRequestArtifacts({
      artifacts: restRequestArtifacts as never,
      meta: {
        method: requestMethod,
        path: normalizeUrl(requestPath)
      }
      // TODO: why did i narrow type?
    }) as unknown as NativeRestRequestArtifact[];
    if (!matchedRequestArtifacts.length) {
      throw next();
    }

    const matchedRouteConfig = matchedRequestArtifacts.find((artifact) => {
      request.params = extractPathParams(artifact, requestPath);
      const { config } = artifact;

      if (!config.entities) return true;

      const entityEntries = Object.entries(config.entities) as Entries<RestEntitiesByEntityName>;
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

        if (!valueOrComparator) {
          return true;
        }

        const mappedEntityEntries = Object.entries(valueOrComparator) as Entries<
          typeof valueOrComparator
        >;
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
    if (!matchedRouteConfig) {
      throw next();
    }

    const requestInterceptors = [
      matchedRouteConfig.componentRequestInterceptor,
      matchedRouteConfig.requestRequestInterceptor,
      matchedRouteConfig.routeRequestInterceptor
    ].filter((requestInterceptor) => !!requestInterceptor);
    for (const requestInterceptor of requestInterceptors) {
      await callRequestInterceptor({
        request,
        interceptor: requestInterceptor
      });
    }

    // TODO: may be move it into file?
    const responseState: ResponseInterceptorsState = {
      headers: new Headers(),
      statusCode: undefined
    };

    const params: NativeRestParams = {
      request,
      appendHeader: (name, value) => {
        responseState.headers.append(name, value);
      },
      clearCookie: (name) => {
        responseState.headers.append(
          'set-cookie',
          serialize(name, '', {
            expires: new Date(0),
            maxAge: 0,
            path: '/'
          })
        );
      },
      getCookie: (name) => request.cookies[name],
      getRequestHeader: (name) => request.headers[name],
      getRequestHeaders: () => request.headers,
      setCookie: (name, value, options) => {
        responseState.headers.append('set-cookie', serialize(name, value, options));
      },
      setDelay: async (delay) => {
        await sleep(delay === Infinity ? 99999999 : delay);
      },
      setHeader: (name, value) => {
        responseState.headers.set(name, value);
      },
      setStatusCode: (statusCode) => {
        responseState.statusCode = statusCode;
      }
    };

    const resolvedData =
      typeof matchedRouteConfig.config.data === 'function'
        ? await matchedRouteConfig.config.data(params)
        : matchedRouteConfig.config.data;

    const dataResponse =
      resolvedData instanceof Response
        ? copyResponseWith(resolvedData, {
            headers: responseState.headers,
            status: responseState.statusCode ?? matchedRouteConfig.config.settings?.status
          })
        : Response.json(resolvedData, {
            headers: responseState.headers,
            status: responseState.statusCode ?? matchedRouteConfig.config.settings?.status
          });

    if (dataResponse.headers.get('content-type') === 'text/event-stream') {
      if (!dataResponse.headers.get('cache-control')) {
        dataResponse.headers.set('cache-control', 'no-store');
      }
      if (matchedRouteConfig.config.settings?.delay) {
        await sleep(matchedRouteConfig.config.settings.delay);
      }
      return dataResponse;
    }

    const interceptorsResponse = await callResponseInterceptors({
      request,
      response: dataResponse,
      responseState,
      interceptors: {
        routeInterceptor: matchedRouteConfig.routeResponseInterceptor,
        requestInterceptor: matchedRouteConfig.requestResponseInterceptor,
        componentInterceptor: matchedRouteConfig.componentResponseInterceptor,
        serverInterceptor: matchedRouteConfig.serverResponseInterceptor
      }
    });

    const finalHeaders = new Headers(interceptorsResponse.headers);
    for (const [name, value] of responseState.headers.entries()) {
      finalHeaders.set(name, value);
    }

    if (!finalHeaders.get('cache-control')) {
      finalHeaders.set('cache-control', 'no-store');
    }
    if (matchedRouteConfig.config.settings?.delay) {
      await sleep(matchedRouteConfig.config.settings.delay);
    }

    return copyResponseWith(interceptorsResponse, {
      headers: finalHeaders,
      status: responseState.statusCode ?? interceptorsResponse.status
    });
  };
