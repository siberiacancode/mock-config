import type {
  BaseRestRequestConfig,
  Data,
  RestEntitiesByEntityName,
  RestFileResponse,
  RestMethod,
  RestParams,
  RestRequestConfig,
  RestRouteConfig,
  RestSettings
} from '@/utils/types';

import { createFileHandler, createQueueHandler } from './helpers';

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
  settings?: RestSettings
): RestRouteConfig<Method> => {
  const resolvedConfig = resolveConfigType(config);
  const settingsConfig = settings ? { settings } : {};

  switch (resolvedConfig.type) {
    case 'inlineResponse':
      return {
        data: resolvedConfig.config,
        ...settingsConfig
      };

    case 'data': {
      return {
        data: resolvedConfig.config.response,
        entities: resolvedConfig.config.match,
        ...settingsConfig
      };
    }

    case 'file': {
      return {
        data: createFileHandler<Method>(resolvedConfig.config.file),
        entities: resolvedConfig.config.match,
        ...settingsConfig
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

        return {
          data: createFileHandler<Method>(item.file),
          time: item.time
        };
      });

      return {
        data: createQueueHandler(normalizedQueue),
        entities: resolvedConfig.config.match,
        ...settingsConfig
      };
    }

    case 'inlineHandler':
      return {
        data: resolvedConfig.config,
        ...settingsConfig
      };

    case 'handler': {
      return {
        data: resolvedConfig.config.handler,
        entities: resolvedConfig.config.match,
        ...settingsConfig
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
  send: (data: Response) => void;
}

const createSseRestFactory = () => {
  function createSseRequestConfig<Response extends string>(
    path: RestRequestConfig['path'],
    config: RestFunction<'get', RestRequestInput, { client: RestSseClient<Response> }>,
    settings?: RestSettings
  ): BaseRestRequestConfig<RestMethod> {
    const originalHandler = config;

    config = (params) => {
      params.setHeader('connection', 'keep-alive');
      params.setHeader('content-type', 'text/event-stream');
      params.setHeader('cache-control', 'no-cache');

      const client: RestSseClient<Response> = {
        send(message) {
          const payload = `data: ${message}\n\n`;
          params.response.write(new TextEncoder().encode(payload));
        },

        close() {
          params.response.end();
        }
      };

      originalHandler({ ...params, client });
    };

    return {
      method: 'get',
      path,
      routes: [createConfigResolver(config, settings)]
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
  sse: createSseRestFactory()
};
