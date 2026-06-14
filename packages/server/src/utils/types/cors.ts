import type { Request } from 'express';

import type { RestMethod } from './shared';
import type { MaybePromise } from './utils';

export type CorsHeader = string;
export type CorsOrigin = string | (string | RegExp)[] | RegExp;

export interface Cors {
  allowedHeaders?: CorsHeader[];
  credentials?: boolean;
  exposedHeaders?: CorsHeader[];
  maxAge?: number;
  methods?: Uppercase<RestMethod>[];
  origin: ((request: Request) => MaybePromise<CorsOrigin>) | CorsOrigin;
}
