import type { Arguments } from 'yargs';

import type { BaseUrl, Cors, Port, StaticPath } from '@/shared/types';

export interface PlaygroundServerConfig {
  baseUrl?: BaseUrl;
  cors?: Cors;
  data: `${string}.json` | Record<string, unknown>;
  port?: Port;
  routes?: `${string}.json` | Record<`/${string}`, `/${string}`>;
  staticPath?: StaticPath;
}

export type PlaygroundServerArgv = Arguments<{
  data: string;
  baseUrl?: string;
  port?: number;
  staticPath?: string;
}>;
