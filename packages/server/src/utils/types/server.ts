import type { Request } from 'express';
import type { Arguments } from 'yargs';

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
}

export interface GraphqlConfig {
  baseUrl?: BaseUrl;
  configs: GraphQLRequestConfig[];
}

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

export interface MockServerComponent {
  baseUrl?: BaseUrl;
  configs: Array<GraphQLRequestConfig | RestRequestConfig>;
  interceptors?: Interceptors;
  name?: string;
}

export interface MockServerSettings {
  baseUrl?: BaseUrl;
  cors?: Cors;
  interceptors?: Interceptors;
  port?: Port;
  staticPath?: StaticPath;
}

export type MockServerConfig = [
  option: MockServerComponent | MockServerSettings,
  ...mockServerComponents: MockServerComponent[]
];
