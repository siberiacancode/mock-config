import type { Express } from 'express';

import bodyParser from 'body-parser';
import express from 'express';

import type {
  FlatMockServerComponent,
  FlatMockServerConfig,
  GraphQLRequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
  RestRequestConfig
} from '@/utils/types';

import { createDatabaseRoutes } from '@/core/database';
import { createGraphQLRoutes } from '@/core/graphql';
import {
  contextMiddleware,
  cookieParseMiddleware,
  corsMiddleware,
  errorMiddleware,
  noCorsMiddleware,
  requestInterceptorMiddleware,
  staticMiddleware
} from '@/core/middlewares';
import { createRestRoutes } from '@/core/rest';

export const createFlatMockServer = (
  flatMockServerConfig: FlatMockServerConfig,
  server: Express = express()
) => {
  const [option, ...flatMockServerComponents] = flatMockServerConfig;

  const flatMockServerSettings = !('configs' in option) ? option : undefined;
  const {
    cors,
    staticPath,
    interceptors,
    baseUrl: serverBaseUrl = '/',
    database
  } = flatMockServerSettings ?? {};

  server.use(bodyParser.urlencoded({ extended: false }));

  server.use(bodyParser.json({ limit: '10mb' }));
  server.set('json spaces', 2);

  server.use(bodyParser.text());

  contextMiddleware(server, { database });

  cookieParseMiddleware(server);

  const serverRequestInterceptor = interceptors?.request;
  if (serverRequestInterceptor) {
    requestInterceptorMiddleware({ server, interceptor: serverRequestInterceptor });
  }

  if (cors) {
    corsMiddleware(server, cors);
  } else {
    noCorsMiddleware(server);
  }

  if (staticPath) {
    staticMiddleware(server, serverBaseUrl, staticPath);
  }

  if (database) {
    const routerWithDatabaseRoutes = createDatabaseRoutes(express.Router(), database);
    server.use(serverBaseUrl, routerWithDatabaseRoutes);
  }

  const components = flatMockServerSettings
    ? flatMockServerComponents
    : (flatMockServerConfig as FlatMockServerComponent[]);
  const { restRequestConfigs, graphQLRequestConfigs } = components.reduce(
    (acc, component) => {
      const { baseUrl = '' } = component;

      component.configs.forEach((config) => {
        const interceptors = {
          ...((component.interceptors?.request || config.interceptors?.request) && {
            request: ((params) => {
              if (component.interceptors?.request) {
                component.interceptors.request(params);
              }
              if (config.interceptors?.request) {
                config.interceptors.request(params);
              }
            }) as RequestInterceptor
          }),
          ...((component.interceptors?.response || config.interceptors?.response) && {
            response: ((data, params) => {
              if (config.interceptors?.response) {
                data = config.interceptors.response(data, params);
              }

              if (component.interceptors?.response) {
                data = component.interceptors.response(data, params);
              }

              return data;
            }) as ResponseInterceptor
          })
        };

        const isRest = 'method' in config;
        if (isRest)
          acc.restRequestConfigs.push({
            ...config,
            interceptors,
            path:
              config.path instanceof RegExp
                ? new RegExp(`${baseUrl}${config.path.source}`, config.path.flags)
                : `${baseUrl}${config.path}`
          });

        const isGraphql = 'operationType' in config;
        if (isGraphql)
          acc.graphQLRequestConfigs.push({
            ...config,
            interceptors
          });
      });

      return acc;
    },
    {
      restRequestConfigs: [] as RestRequestConfig[],
      graphQLRequestConfigs: [] as GraphQLRequestConfig[]
    }
  );

  if (restRequestConfigs.length) {
    const routerWithRestRoutes = createRestRoutes({
      router: express.Router(),
      restConfig: {
        configs: restRequestConfigs
      },
      serverResponseInterceptor: interceptors?.response
    });

    server.use(serverBaseUrl, routerWithRestRoutes);
  }

  if (graphQLRequestConfigs.length) {
    const routerWithGraphQLRoutes = createGraphQLRoutes({
      router: express.Router(),
      graphqlConfig: {
        configs: graphQLRequestConfigs
      },
      serverResponseInterceptor: interceptors?.response
    });

    server.use(serverBaseUrl, routerWithGraphQLRoutes);
  }

  errorMiddleware(server);

  return server;
};
