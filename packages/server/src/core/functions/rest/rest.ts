import { z } from 'zod';

import type {
  BaseRestRequestConfig,
  Data,
  RestEntitiesByEntityName,
  RestFileResponse,
  RestMethod,
  RestParams,
  RestRequestConfig,
  RestSettings
} from '@/utils/types';

import { createFileHandler } from './helpers';

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
) => {
  const resolvedConfig = resolveConfigType(config);

  switch (resolvedConfig.type) {
    case 'inlineResponse':
      return {
        data: resolvedConfig.config,
        settings: { ...settings, polling: false as const }
      };

    case 'data': {
      return {
        data: resolvedConfig.config.response,
        entities: resolvedConfig.config.match,
        settings: { ...settings, polling: false as const }
      };
    }

    case 'file': {
      return {
        data: createFileHandler<Method>(resolvedConfig.config.file),
        entities: resolvedConfig.config.match,
        settings: { ...settings, polling: false as const }
      };
    }

    case 'queue': {
      return {
        queue: resolvedConfig.config.queue.map((item) => {
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
        }),
        entities: resolvedConfig.config.match,
        settings: { ...settings, polling: true as const }
      };
    }

    case 'inlineHandler':
      return {
        data: resolvedConfig.config,
        settings: { ...settings, polling: false as const }
      };

    case 'handler': {
      return {
        data: resolvedConfig.config.handler,
        entities: resolvedConfig.config.match,
        settings: { ...settings, polling: false as const }
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

const sseMetaSchema = z
  .strictObject({
    event: z.string().optional(),
    id: z.string().optional(),
    retry: z.number().int().nonnegative().optional()
  })
  .optional();

const normalizeSseFieldValue = (value: string) => value.replaceAll('\r', '').replaceAll('\n', '');

const formatSsePayload = (data: string, meta?: { event?: string; id?: string; retry?: number }) => {
  const parseMetaResult = sseMetaSchema.safeParse(meta);
  if (!parseMetaResult.success) {
    throw new Error(`Invalid SSE meta: ${parseMetaResult.error.issues[0]?.message}`);
  }

  const parsedMeta = parseMetaResult.data;
  const lines: string[] = [];

  if (parsedMeta?.id) {
    lines.push(`id: ${normalizeSseFieldValue(parsedMeta.id)}`);
  }

  if (parsedMeta?.event) {
    lines.push(`event: ${normalizeSseFieldValue(parsedMeta.event)}`);
  }

  if (parsedMeta?.retry) {
    lines.push(`retry: ${parsedMeta.retry}`);
  }

  data.split(/\r\n|\r|\n/).forEach((line) => {
    lines.push(`data: ${line}`);
  });

  return `${lines.join('\n')}\n\n`;
};

const createSseRestFactory = <Method extends 'get' | 'post'>(method: Method) => {
  function createSseRequestConfig<
    Options extends RestRequestInput = Partial<RestRequestInput>,
    Response extends string = string
  >(
    path: RestRequestConfig['path'],
    config: RestFunction<Method, Options, { client: RestSseClient<Response> }>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method> {
    const sseHandler: RestFunction<Method, Options> = (params) => {
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

      return config({ ...params, client });
    };

    return {
      method,
      path,
      routes: [createConfigResolver(sseHandler, settings)]
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
