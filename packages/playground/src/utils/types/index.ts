import type { BaseUrl, Cors, Port, StaticPath } from '@/shared/types';
import type { Arguments } from 'yargs';

export interface PlaygroundServerConfig {
  baseUrl?: BaseUrl;
  data: `${string}.json` | Record<string, unknown>;
  port?: Port;
  cors?: Cors;
  staticPath?: StaticPath;
  routes?: `${string}.json` | Record<`/${string}`, `/${string}`>;
}

export type PlaygroundServerArgv = Arguments<{
  data: string;
  baseUrl?: string;
  port?: number;
  staticPath?: string;
}>;
