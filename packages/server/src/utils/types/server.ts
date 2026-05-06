import type { Express } from 'express';
import type { Arguments } from 'yargs';

import type { Cors } from './cors';
import type { Database, DatabaseConfig, Orm } from './database';
import type { GraphQLRequestConfig } from './graphql';
import type { GraphqlTransportWsRequestConfig } from './graphql-transport-ws';
import type { Interceptors } from './interceptors';
import type { RestRequestConfig } from './rest';
import type { WsRequestConfig } from './ws';

interface StaticPathObject {
  path: `/${string}`;
  prefix: `/${string}`;
}
export type StaticPath = `/${string}` | (`/${string}` | StaticPathObject)[] | StaticPathObject;

export type Port = number;
export type BaseUrl = `/${string}`;

export interface BaseServerConfig {
  baseUrl?: BaseUrl;
  cors?: Cors;
  interceptors?: Interceptors;
  port?: Port;
  staticPath?: StaticPath;
}

export type MockServerCliArgv = Arguments<{
  baseUrl?: string;
  port?: number;
  staticPath?: string;
  config?: string;
  watch?: boolean;
}>;

type Queries = Express['request']['query'];

declare global {
  namespace Express {
    interface Request {
      context: {
        orm: Orm<Database>;
        broadcast: <Response>(response: Response) => void;
      };
      queries: Queries;
    }
  }
}

export interface MockServerComponent {
  baseUrl?: BaseUrl;
  configs: Array<
    GraphQLRequestConfig | GraphqlTransportWsRequestConfig | RestRequestConfig | WsRequestConfig
  >;
  interceptors?: Interceptors;
  name?: string;
}

export interface MockServerSettings {
  baseUrl?: BaseUrl;
  cors?: Cors;
  database?: DatabaseConfig;
  interceptors?: Interceptors;
  port?: Port;
  staticPath?: StaticPath;
}

export type MockServerConfig = [
  option: MockServerComponent | MockServerSettings,
  ...mockServerComponents: MockServerComponent[]
];
