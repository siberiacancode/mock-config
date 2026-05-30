import type {
  BaseRestRequestConfig,
  Data,
  MaybePromise,
  RestEntitiesByEntityName,
  RestFileResponse,
  RestMethod,
  RestParams,
  RestRequestConfig,
  RestRouteConfig,
  RestSettings
} from '@/utils/types';

import { createFileHandler, createQueueHandler, formatSsePayload } from './helpers';

interface RestRequestInput {
  body?: unknown;
  params?: unknown;
  query?: unknown;
  response?: Data;
}

type ReservedRestConfigKeys = {
  [K in 'file' | 'handler' | 'match' | 'queue' | 'response']?: never;
};

type RestInlineResponse<Response> =
  Response extends Record<string, unknown> ? Response & ReservedRestConfigKeys : Response;

type RestFunction<
  Method extends RestMethod,
  Options extends RestRequestInput,
  AdditionalParams = {}
> = (
  params: RestParams<
    Method,
    Options['query'],
    Options['body'],
    Options['params'],
    Options['response']
  > &
    AdditionalParams
) => MaybePromise<Options['response']>;

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
  | RestFileObject<Method>
  | RestFunction<Method, Options>
  | RestHandlerObject<Method, Options>
  | RestInlineResponse<Options['response']>
  | RestQueueObject<Method, Options>
  | RestResponseObject<Method, Options['response']>;

const resolveConfigType = <Method extends RestMethod, Options extends RestRequestInput>(
  config: RestConfig<Method, Options>
) => {
  if (typeof config === 'function') return { type: 'inlineHandler' as const, config };
  if (typeof config !== 'object' || config === null)
    return { type: 'inlineResponse' as const, config };
  if ('queue' in config) return { type: 'queue' as const, config };
  if ('file' in config) return { type: 'file' as const, config };
  if ('response' in config) return { type: 'data' as const, config };
  if ('handler' in config) return { type: 'handler' as const, config };
  return { type: 'inlineResponse' as const, config };
};

const createConfigResolver = <Method extends RestMethod, Options extends RestRequestInput>(
  config: RestConfig<Method, Options>,
  settings: RestSettings = {}
): RestRouteConfig<Method> => {
  const resolvedConfig = resolveConfigType(config);

  switch (resolvedConfig.type) {
    case 'inlineHandler':
    case 'inlineResponse':
      return {
        data: resolvedConfig.config,
        settings
      };

    case 'data': {
      return {
        data: resolvedConfig.config.response,
        entities: resolvedConfig.config.match,
        settings
      };
    }

    case 'file': {
      return {
        data: createFileHandler<Method>(resolvedConfig.config.file),
        entities: resolvedConfig.config.match,
        settings
      };
    }

    case 'queue': {
      const normalizedQueue = resolvedConfig.config.queue.map((item) => {
        if ('handler' in item) {
          return { data: item.handler, time: item.time };
        }

        if ('response' in item) {
          return { data: item.response, time: item.time };
        }

        if ('file' in item) {
          return {
            data: createFileHandler<Method>(item.file),
            time: item.time
          };
        }

        throw new Error(`Unexpected queue item kind: ${JSON.stringify(item, null, 2)}`);
      });

      return {
        data: createQueueHandler(normalizedQueue),
        entities: resolvedConfig.config.match,
        settings
      };
    }

    case 'handler': {
      return {
        data: resolvedConfig.config.handler,
        entities: resolvedConfig.config.match,
        settings
      };
    }

    default: {
      throw new Error(`Unexpected route config kind: ${JSON.stringify(config, null, 2)}`);
    }
  }
};

const createRestFactory = <Method extends RestMethod>(method: Method) => {
  function createRequestConfig<Options extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestResponseObject<Method, Options['response']>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig(
    path: RestRequestConfig['path'],
    config: RestFileObject<Method>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Options extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestHandlerObject<Method, Options>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Options extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestFunction<Method, Options>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Options extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestQueueObject<Method, Options>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Options extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestInlineResponse<Options['response']>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Options extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestConfig<Method, Options>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method> {
    return {
      method,
      path,
      routes: [createConfigResolver(config, settings)]
    };
  }

  return createRequestConfig;
};

interface RestSseClient<Response extends string> {
  close: () => void;
  send: (
    data: Response,
    meta?: {
      event?: string;
      id?: string;
      retry?: number;
    }
  ) => void;
}

interface SseRestHandlerObject<
  Method extends 'get' | 'post',
  Options extends RestRequestInput,
  Response extends string
> {
  handler: RestFunction<Method, Options, { client: RestSseClient<Response> }>;
  match?: RestEntitiesByEntityName<Method>;
}

const createSseRestFactory = <Method extends 'get' | 'post'>(method: Method) => {
  function createSseRequestConfig<
    Options extends RestRequestInput = Partial<RestRequestInput>,
    Response extends string = string
  >(
    path: RestRequestConfig['path'],
    config: SseRestHandlerObject<Method, Options, Response>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createSseRequestConfig<
    Options extends RestRequestInput = Partial<RestRequestInput>,
    Response extends string = string
  >(
    path: RestRequestConfig['path'],
    config: RestFunction<Method, Options, { client: RestSseClient<Response> }>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createSseRequestConfig<
    Options extends RestRequestInput = Partial<RestRequestInput>,
    Response extends string = string
  >(
    path: RestRequestConfig['path'],
    config:
      | RestFunction<Method, Options, { client: RestSseClient<Response> }>
      | SseRestHandlerObject<Method, Options, Response>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method> {
    const { handler, match }: SseRestHandlerObject<Method, Options, Response> =
      typeof config === 'function' ? { handler: config } : config;

    const wrapperHandler: RestFunction<Method, Options> = (params) => {
      params.setHeader('connection', 'keep-alive');
      params.setHeader('content-type', 'text/event-stream');
      params.setHeader('cache-control', 'no-cache');

      const client: RestSseClient<Response> = {
        send(message, meta) {
          const payload = formatSsePayload(message, meta);
          params.response.write(payload);
        },

        close() {
          params.response.end();
        }
      };

      return handler({ ...params, client });
    };

    return {
      method,
      path,
      routes: [createConfigResolver({ handler: wrapperHandler, match }, settings)]
    };
  }

  return createSseRequestConfig;
};

export const rest = {
  delete: createRestFactory('delete'),
  get: createRestFactory('get'),
  options: createRestFactory('options'),
  patch: createRestFactory('patch'),
  post: createRestFactory('post'),
  put: createRestFactory('put'),
  sse: createSseRestFactory('get'),
  stream: createSseRestFactory('post')
};
