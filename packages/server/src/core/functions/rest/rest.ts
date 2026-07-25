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

import { isGeneratorFunction } from '@/utils/helpers';

import { createGenerator } from '../shared/helpers';
import { createFileHandler, createPollingHandler, formatSsePayload } from './helpers';

interface RestRequestInput {
  body?: unknown;
  params?: unknown;
  query?: unknown;
  response?: Data;
}

type RestFactorySettings<Method extends RestMethod> = RestSettings & {
  match?: RestEntitiesByEntityName<Method>;
};

type ReservedRestConfigKeys = {
  [K in 'file' | 'polling']?: never;
};

type RestInlineResponse<Response> =
  Response extends Record<string, unknown> ? Response & ReservedRestConfigKeys : Response;

type RestFunction<
  Method extends RestMethod,
  Input extends RestRequestInput,
  AdditionalParams = {}
> = (
  params: RestParams<Method, Input['query'], Input['body'], Input['params'], Input['response']> &
    AdditionalParams
) => MaybePromise<Input['response']>;

type RestGeneratorFunction<Method extends RestMethod, Input extends RestRequestInput> = (
  params: RestParams<Method, Input['query'], Input['body'], Input['params'], Input['response']>
) => Generator<
  Input['response'],
  Input['response'] | void,
  RestParams<Method, Input['query'], Input['body'], Input['params'], Input['response']>
>;

interface RestFileObject {
  file: RestFileResponse;
}

type RestPollingItem<Method extends RestMethod, Input extends RestRequestInput> =
  | { file: RestFileResponse; time?: number }
  | { handler: RestFunction<Method, Input>; time?: number }
  | { response: Input['response']; time?: number };

type RestPolling<Method extends RestMethod, Input extends RestRequestInput> = RestPollingItem<
  Method,
  Input
>[];

interface RestPollingObject<Method extends RestMethod, Input extends RestRequestInput> {
  polling: RestPolling<Method, Input>;
}

type RestConfig<Method extends RestMethod, Input extends RestRequestInput> =
  | RestFileObject
  | RestFunction<Method, Input>
  | RestGeneratorFunction<Method, Input>
  | RestInlineResponse<Input['response']>
  | RestPollingObject<Method, Input>;

const resolveConfigType = <Method extends RestMethod, Input extends RestRequestInput>(
  config: RestConfig<Method, Input>
) => {
  if (typeof config === 'function' && isGeneratorFunction(config))
    return { type: 'generator' as const, config };
  if (typeof config === 'function') return { type: 'handler' as const, config };
  if (typeof config !== 'object' || config === null) return { type: 'data' as const, config };
  if ('polling' in config) return { type: 'polling' as const, config };
  if ('file' in config) return { type: 'file' as const, config };
  return { type: 'data' as const, config };
};

const createConfigResolver = <Method extends RestMethod, Input extends RestRequestInput>(
  config: RestConfig<Method, Input>,
  factorySettings: RestFactorySettings<Method> = {}
): RestRouteConfig<Method> => {
  const resolvedConfig = resolveConfigType(config);
  const { match: entities = {}, ...settings } = factorySettings;

  switch (resolvedConfig.type) {
    case 'data': {
      return {
        data: resolvedConfig.config,
        entities,
        settings
      };
    }

    case 'file': {
      return {
        data: createFileHandler<Method>(resolvedConfig.config.file),
        entities,
        settings
      };
    }

    case 'polling': {
      const polling = resolvedConfig.config.polling;
      const normalizedPolling = polling.map((item) => {
        if ('handler' in item) {
          return {
            data: item.handler,
            time: item.time
          };
        }

        if ('response' in item) {
          return { data: item.response, time: item.time };
        }

        if ('file' in item) {
          return { data: createFileHandler<Method>(item.file), time: item.time };
        }

        throw new Error(`Unexpected polling item kind: ${JSON.stringify(item, null, 2)}`);
      });

      return {
        data: createPollingHandler(normalizedPolling),
        entities,
        settings
      };
    }

    case 'generator': {
      const config = resolvedConfig.config as RestGeneratorFunction<Method, Input>;
      const generator = createGenerator(config);
      return { data: generator, entities, settings };
    }

    case 'handler': {
      return {
        data: resolvedConfig.config,
        entities,
        settings
      };
    }

    default: {
      throw new Error(`Unexpected route config kind: ${JSON.stringify(config, null, 2)}`);
    }
  }
};

const createRestFactory = <Method extends RestMethod>(method: Method) => {
  function createRequestConfig(
    path: RestRequestConfig['path'],
    config: RestFileObject,
    settings?: RestFactorySettings<Method>
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Input extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestPollingObject<Method, Input>,
    settings?: RestFactorySettings<Method>
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Input extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestFunction<Method, Input> | RestGeneratorFunction<Method, Input>,
    settings?: RestFactorySettings<Method>
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Input extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestInlineResponse<Input['response']>,
    settings?: RestFactorySettings<Method>
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Input extends RestRequestInput = Partial<RestRequestInput>>(
    path: RestRequestConfig['path'],
    config: RestConfig<Method, Input>,
    settings?: RestFactorySettings<Method>
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

const createSseRestFactory = <Method extends 'get' | 'post'>(method: Method) => {
  function createSseRequestConfig<
    Input extends RestRequestInput = Partial<RestRequestInput>,
    Response extends string = string
  >(
    path: RestRequestConfig['path'],
    handler: RestFunction<Method, Input, { client: RestSseClient<Response> }>,
    settings?: RestFactorySettings<Method>
  ): BaseRestRequestConfig<Method> {
    const wrapperHandler: RestFunction<Method, Input> = (params) => {
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
      routes: [createConfigResolver(wrapperHandler, settings)]
    };
  }

  return createSseRequestConfig;
};

const file = <Path extends RestFileResponse>(path: Path) => ({ file: path });

const polling = <
  Method extends RestMethod = RestMethod,
  Input extends RestRequestInput = Partial<RestRequestInput>
>(
  value: RestPollingObject<Method, Input>['polling']
) => ({ polling: value });

export const rest = {
  delete: createRestFactory('delete'),
  file,
  get: createRestFactory('get'),
  options: createRestFactory('options'),
  patch: createRestFactory('patch'),
  polling,
  post: createRestFactory('post'),
  put: createRestFactory('put'),
  sse: createSseRestFactory('get'),
  stream: createSseRestFactory('post')
};
