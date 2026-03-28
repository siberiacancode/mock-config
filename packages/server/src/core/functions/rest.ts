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

type RestFunction<Method extends RestMethod, Options extends RestRequestInput> = (
  params: RestParams<
    Method,
    Options['query'],
    Options['body'],
    Options['params'],
    Options['response']
  >
) => Options['response'] | Promise<Options['response']>;

interface RestResponseObject<Method extends RestMethod, Response> {
  match?: RestEntitiesByEntityName<Method>;
  response: Response;
}

interface RestHandlerObject<Method extends RestMethod, Options extends RestRequestInput> {
  handler: RestFunction<Method, Options>;
  match?: RestEntitiesByEntityName<Method>;
}

interface RestFileObject<Method extends RestMethod> {
  file: RestFileResponse;
  match?: RestEntitiesByEntityName<Method>;
}

interface RestQueueObject<Method extends RestMethod, Options extends RestRequestInput> {
  match?: RestEntitiesByEntityName<Method>;
  queue: Array<
    | { file: RestFileResponse; time?: number }
    | { handler: RestFunction<Method, Options>; time?: number }
    | { response: Options['response']; time?: number }
  >;
}

type RestConfig<Method extends RestMethod, Options extends RestRequestInput> =
  | InlineResponse<Response>
  | RestFileObject<Method>
  | RestFunction<Method, Options>
  | RestHandlerObject<Method, Options>
  | RestQueueObject<Method, Options>
  | RestResponseObject<Method, Response>;

const resolveConfigType = <Method extends RestMethod, Options extends RestRequestInput>(
  config: RestConfig<Method, Options>
) => {
  if (typeof config === 'function') return 'handler';
  if (!isPlainObject(config)) return 'inlineResponse';
  if ('queue' in config) return 'queue';
  if ('file' in config) return 'file';
  if ('response' in config) return 'data';
  if ('handler' in config) return 'handler';
  return 'inlineResponse';
};

const createConfigResolver = <Method extends RestMethod, Options extends RestRequestInput>(
  config: RestConfig<Method, Options>,
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
      const queueConfig = config as RestQueueObject<Method, Options>;

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
          ...settings,
          polling: true
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

      const handlerConfig = config as RestHandlerObject<Method, Options>;

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
    Options extends RestRequestInput = Request
  >(
    path: RestRequestConfig['path'],
    config: RestHandlerObject<Method, Options>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Options extends RestRequestInput = Request
  >(
    path: RestRequestConfig['path'],
    config: RestFunction<Method, Options>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Options extends RestRequestInput = Request
  >(
    path: RestRequestConfig['path'],
    config: RestQueueObject<Method, Options>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Options extends RestRequestInput = Request
  >(
    path: RestRequestConfig['path'],
    config: InlineResponse<Options['response']>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<
    Request extends Partial<RestRequestInput> = {},
    Options extends RestRequestInput = Request
  >(
    path: RestRequestConfig['path'],
    config: RestConfig<Method, Options>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method> {
    return {
      method,
      path,
      routes: [
        createConfigResolver(
          config as RestConfig<Method, Options>,
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
