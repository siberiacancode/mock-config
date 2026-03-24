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

type RestFunction<Method extends RestMethod, Data> = (
  params: RestParams<Method>
) => Data | Promise<Data>;

interface RestResponseObject<Method extends RestMethod, Data> {
  match?: RestEntitiesByEntityName<Method>;
  response: Data;
}

interface RestHandlerObject<Method extends RestMethod, Data> {
  handler: RestFunction<Method, Data>;
  match?: RestEntitiesByEntityName<Method>;
}

interface RestFileObject<Method extends RestMethod> {
  file: RestFileResponse;
  match?: RestEntitiesByEntityName<Method>;
}

interface RestQueueDataItem<Data> {
  response: Data;
  time?: number;
}

interface RestQueueHandlerItem<Method extends RestMethod, Data> {
  handler: RestFunction<Method, Data>;
  time?: number;
}

interface RestQueueFileItem {
  file: RestFileResponse;
  time?: number;
}

interface RestQueueObject<Method extends RestMethod, Data> {
  match?: RestEntitiesByEntityName<Method>;
  queue: Array<RestQueueDataItem<Data> | RestQueueFileItem | RestQueueHandlerItem<Method, Data>>;
}

type RestObjectConfig<Method extends RestMethod, Data> =
  | RestFileObject<Method>
  | RestHandlerObject<Method, Data>
  | RestQueueObject<Method, Data>
  | RestResponseObject<Method, Data>;

type ReservedConfigKeys = 'file' | 'handler' | 'match' | 'queue' | 'response';

type NoReservedKeys = {
  [K in ReservedConfigKeys]?: never;
};

type InlineData<Data> = Data extends Record<string, unknown> ? Data & NoReservedKeys : Data;

type RestConfig<Method extends RestMethod, Data> =
  | InlineData<Data>
  | RestFunction<Method, Data>
  | RestObjectConfig<Method, Data>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isRecordWithKey = <TKey extends string>(
  value: unknown,
  key: TKey
): value is Record<TKey, unknown> => isPlainObject(value) && key in value;

const resolveConfigType = <Method extends RestMethod, Data>(config: RestConfig<Method, Data>) => {
  if (typeof config === 'function') return 'handler';
  if (!isPlainObject(config)) return 'inlineData';
  if (isRecordWithKey(config, 'queue')) return 'queue';
  if (isRecordWithKey(config, 'file')) return 'file';
  if (isRecordWithKey(config, 'response')) return 'data';
  if (isRecordWithKey(config, 'handler')) return 'handler';
  return 'inlineData';
};

const createConfigResolver = <Method extends RestMethod, Data>(
  config: RestConfig<Method, Data>,
  settings?: RestSettings
) => {
  const type = resolveConfigType(config);

  switch (type) {
    case 'inlineData':
      return {
        data: config as Data,
        entities: {},
        settings: {
          polling: false,
          ...settings
        }
      };

    case 'data': {
      const dataConfig = config as RestResponseObject<Method, Data>;

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
      const queueConfig = config as RestQueueObject<Method, Data>;

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

      const handlerConfig = config as RestHandlerObject<Method, Data>;

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
  function createRequestConfig<Data>(
    path: RestRequestConfig['path'],
    config: RestResponseObject<Method, Data>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Data>(
    path: RestRequestConfig['path'],
    config: RestQueueObject<Method, Data>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig(
    path: RestRequestConfig['path'],
    config: RestFileObject<Method>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Data>(
    path: RestRequestConfig['path'],
    config: RestHandlerObject<Method, Data>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Data>(
    path: RestRequestConfig['path'],
    config: RestFunction<Method, Data>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Data>(
    path: RestRequestConfig['path'],
    config: InlineData<Data>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method>;

  function createRequestConfig<Data>(
    path: RestRequestConfig['path'],
    config: RestConfig<Method, Data>,
    settings?: RestSettings
  ): BaseRestRequestConfig<Method> {
    return {
      method,
      path,
      routes: [createConfigResolver(config, settings) as RestRouteConfig<Method>]
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
