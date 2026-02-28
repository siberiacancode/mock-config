import type { Request } from 'express';
import type { Arguments } from 'yargs';

import type { Database, Orm } from './database';
import type { GraphQLRequestConfig } from './graphql';
import type { Interceptors } from './interceptors';
import type { RestMethod, RestRequestConfig } from './rest';

interface StaticPathObject {
  path: `/${string}`;
  prefix: `/${string}`;
}
export type StaticPath = `/${string}` | (`/${string}` | StaticPathObject)[] | StaticPathObject;

type CorsHeader = string;
export type CorsOrigin = string | (string | RegExp)[] | RegExp;
export interface Cors {
  allowedHeaders?: CorsHeader[];
  credentials?: boolean;
  exposedHeaders?: CorsHeader[];
  maxAge?: number;
  methods?: Uppercase<RestMethod>[];
  origin: ((request: Request) => CorsOrigin | Promise<CorsOrigin>) | CorsOrigin;
}

type Port = number;
export type BaseUrl = `/${string}`;

export interface RestConfig {
  baseUrl?: BaseUrl;
  configs: RestRequestConfig[];
  interceptors?: Interceptors<'rest'>;
}

export interface GraphqlConfig {
  baseUrl?: BaseUrl;
  configs: GraphQLRequestConfig[];
  interceptors?: Interceptors<'graphql'>;
}

export interface DatabaseConfig {
  data: `${string}.json` | Record<string, unknown>;
  routes?: `${string}.json` | Record<`/${string}`, `/${string}`>;
}

export interface BaseMockServerConfig {
  baseUrl?: BaseUrl;
  cors?: Cors;
  interceptors?: Interceptors;
  port?: Port;
  staticPath?: StaticPath;
}

export interface MockServerConfig extends BaseMockServerConfig {
  database?: DatabaseConfig;
  graphql?: GraphqlConfig;
  rest?: RestConfig;
}

export interface RestMockServerConfig extends BaseMockServerConfig {
  configs?: RestRequestConfig[];
  database?: DatabaseConfig;
}

export interface GraphQLMockServerConfig extends BaseMockServerConfig {
  configs?: GraphQLRequestConfig[];
  database?: DatabaseConfig;
}

export interface DatabaseMockServerConfig extends BaseMockServerConfig {
  data: `${string}.json` | Record<string, unknown>;
  routes?: `${string}.json` | Record<`/${string}`, `/${string}`>;
}

export type MockServerConfigArgv = Arguments<{
  baseUrl?: string;
  port?: number;
  staticPath?: string;
  config?: string;
  watch?: boolean;
}>;

declare global {
  namespace Express {
    interface Request {
      context: {
        orm: Orm<Database>;
      };
    }
  }
}
export interface FlatMockServerComponent {
  baseUrl?: BaseUrl;
  configs: Array<GraphQLRequestConfig | RestRequestConfig>;
  interceptors?: Interceptors;
  name?: string;
}

export interface FlatMockServerSettings {
  baseUrl?: BaseUrl;
  cors?: Cors;
  database?: DatabaseConfig;
  interceptors?: Interceptors;
  port?: Port;
  staticPath?: StaticPath;
}

export type FlatMockServerConfig = [
  option: FlatMockServerComponent | FlatMockServerSettings,
  ...flatMockServerComponents: FlatMockServerComponent[]
];
