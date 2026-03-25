import type {
  BaseRestRequestConfig,
  RestEntitiesByEntityName,
  RestFileResponse,
  RestMethod,
  RestParams,
  RestRequestConfig,
  RestRouteConfig,
  RestSettings
} from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

interface RestRequestInput {
  body?: unknown;
  params?: unknown;
  query?: unknown;
  response?: unknown;
}

type ReservedRestConfigKeys = {
  [K in 'file' | 'handler' | 'match' | 'queue' | 'response']?: never;
};

type InlineResponse<Response> =
  Response extends Record<string, unknown> ? Response & ReservedRestConfigKeys : Response;

type RestFunction<Method extends RestMethod, Response, Query, Body, Params> = (
  params: RestParams<Method, Query, Body, Params, Response>
) => Promise<Response> | Response;

interface RestResponseObject<Method extends RestMethod, Response> {
  match?: RestEntitiesByEntityName<Method>;
  response: Response;
}

interface RestHandlerObject<Method extends RestMethod, Response, Query, Body, Params> {
  handler: RestFunction<Method, Response, Query, Body, Params>;
  match?: RestEntitiesByEntityName<Method>;
}

interface RestFileObject<Method extends RestMethod> {
  file: RestFileResponse;
  match?: RestEntitiesByEntityName<Method>;
}

interface RestQueueResponseItem<Response> {
  response: Response;
  time?: number;
}

interface RestQueueHandlerItem<Method extends RestMethod, Response, Query, Body, Params> {
  handler: RestFunction<Method, Response, Query, Body, Params>;
  time?: number;
}

interface RestQueueFileItem {
  file: RestFileResponse;
  time?: number;
}

interface RestQueueObject<Method extends RestMethod, Response, Query, Body, Params> {
  match?: RestEntitiesByEntityName<Method>;
  queue: Array<
    | RestQueueFileItem
    | RestQueueHandlerItem<Method, Response, Query, Body, Params>
    | RestQueueResponseItem<Response>
  >;
}

type RestObjectConfig<Method extends RestMethod, Response, Query, Body, Params> =
  | RestFileObject<Method>
  | RestHandlerObject<Method, Response, Query, Body, Params>
  | RestQueueObject<Method, Response, Query, Body, Params>
  | RestResponseObject<Method, Response>;

type RestConfig<Method extends RestMethod, Response, Query, Body, Params> =
  | InlineResponse<Response>
  | RestFunction<Method, Response, Query, Body, Params>
  | RestObjectConfig<Method, Response, Query, Body, Params>;

const resolveConfigType = <Method extends RestMethod, Response, Query, Body, Params>(
  config: RestConfig<Method, Response, Query, Body, Params>
) => {
  if (typeof config === 'function') return 'handler';
  if (!isPlainObject(config)) return 'inlineResponse';
  if (isPlainObject(config)) {
    if ('queue' in config) return 'queue';
    if ('file' in config) return 'file';
    if ('response' in config) return 'data';
    if ('handler' in config) return 'handler';
  }
  return 'inlineResponse';
};

const createConfigResolver = <Method extends RestMethod, Response, Query, Body, Params>(
  config: RestConfig<Method, Response, Query, Body, Params>,
  settings?: RestSettings
) => {
  const type = resolveConfigType(config);

  switch (type) {
    case 'inlineResponse':
      return {
        data: config as Response,
        entities: {},
        settings: {
          polling: false,
          ...settings
        }
      };

    case 'data': {
      const dataConfig = config as RestResponseObject<Method, Response>;

      return {
        data: dataConfig.response,
        entities: dataConfig.match ?? {},
        settings: {
          polling: false,
          ...settings
        }
      };
    }

    case 'file': {
      const fileConfig = config as RestFileObject<Method>;

      return {
        file: fileConfig.file,
        entities: fileConfig.match ?? {},
        settings: {
          polling: false,
          ...settings
        }
      };
    }

    case 'queue': {
      const queueConfig = config as RestQueueObject<Method, Response, Query, Body, Params>;

      return {
        queue: queueConfig.queue.map((item) => {
          if ('handler' in item) {
            return {
              data: item.handler,
              ...(typeof item.time === 'number' ? { time: item.time } : {})
            };
          }

          if ('response' in item) {
            return {
              data: item.response,
              ...(typeof item.time === 'number' ? { time: item.time } : {})
            };
          }

          return item;
        }),
        entities: queueConfig.match ?? {},
        settings: {
          polling: true,
          ...settings
        }
      };
    }

    case 'handler': {
      if (typeof config === 'function') {
        return {
          data: config,
          entities: {},
          settings: {
            polling: false,
            ...settings
          }
        };
      }

      const handlerConfig = config as RestHandlerObject<Method, Response, Query, Body, Params>;

      return {
        data: handlerConfig.handler,
        entities: handlerConfig.match ?? {},
        settings: {
          polling: false,
          ...settings
        }
      };
    }

    default:
      throw new Error(`Unexpected route config kind: ${type}`);
  }
};

const createRestFactory = <Method extends RestMethod>(method: Method) => {
  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Response = Request['response']
  >(
    path: RestRequestConfig['path'],
    config: RestResponseObject<Method, Response>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig(
    path: RestRequestConfig['path'],
    config: RestFileObject<Method>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Response = Request['response'],
    Query = Request['query'],
    Body = Request['body'],
    Params = Request['params']
  >(
    path: RestRequestConfig['path'],
    config: RestHandlerObject<Method, Response, Query, Body, Params>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Response = Request['response'],
    Query = Request['query'],
    Body = Request['body'],
    Params = Request['params']
  >(
    path: RestRequestConfig['path'],
    config: RestFunction<Method, Response, Query, Body, Params>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Response = Request['response'],
    Query = Request['query'],
    Body = Request['body'],
    Params = Request['params']
  >(
    path: RestRequestConfig['path'],
    config: RestQueueObject<Method, Response, Query, Body, Params>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Response = Request['response']
  >(
    path: RestRequestConfig['path'],
    config: InlineResponse<Response>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Response = Request['response'],
    Query = Request['query'],
    Body = Request['body'],
    Params = Request['params']
  >(
    path: RestRequestConfig['path'],
    config: RestConfig<Method, Response, Query, Body, Params>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method> {
    return {
      method,
      path,
      routes: [
        createConfigResolver(
          config as RestConfig<Method, Response, Query, Body, Params>,
          settings
        ) as RestRouteConfig<Method>
      ]
    };
  }

  return createRequestConfig;
};

export const rest = {
  delete: createRestFactory('delete'),
  get: createRestFactory('get'),
  options: createRestFactory('options'),
  patch: createRestFactory('patch'),
  post: createRestFactory('post'),
  put: createRestFactory('put')
};
