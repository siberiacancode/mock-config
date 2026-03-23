import type { Query as ExpressQuery, ParamsDictionary } from 'express-serve-static-core';
import type { IncomingHttpHeaders } from 'node:http';

export type PlainObject = Record<string, any>;

export type Primitive = bigint | boolean | number | string | symbol | null | undefined;

export type Headers = IncomingHttpHeaders;
export type Query = ExpressQuery;
export type Params = ParamsDictionary;
export type Cookies = Record<string, string>;

export type Data = boolean | number | string | any[] | Record<any, any> | null | undefined;
