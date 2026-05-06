import type { Request } from 'express';

import type { RestMethod } from './rest';

export type CorsHeader = string;
export type CorsOrigin = string | (string | RegExp)[] | RegExp;

export interface Cors {
  allowedHeaders?: CorsHeader[];
  credentials?: boolean;
  exposedHeaders?: CorsHeader[];
  maxAge?: number;
  methods?: Uppercase<RestMethod>[];
  origin: ((request: Request) => CorsOrigin | Promise<CorsOrigin>) | CorsOrigin;
}
