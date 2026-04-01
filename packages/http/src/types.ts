import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

export type QueryValue = string | string[] | undefined;
export type Query = Record<string, QueryValue>;
export type Params = Record<string, string>;

export type Port = number;
export type BaseUrl = `/${string}`;

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
  methods?: Array<'DELETE' | 'GET' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT'>;
  origin: ((request: HttpRequest) => CorsOrigin | Promise<CorsOrigin>) | CorsOrigin;
}

export interface HttpRequest {
  body?: unknown;
  cookies: Record<string, string>;
  get: (headerName: string) => string | undefined;
  headers: IncomingHttpHeaders;
  method: string;
  originalUrl: string;
  params: Params;
  path: string;
  protocol: string;
  query: Query;
  raw: IncomingMessage;
  url: string;
}

export interface HttpResponse {
  end: (body?: string) => void;
  json: (body: unknown) => void;
  links: (links: Record<string, string>) => void;
  raw: ServerResponse;
  send: (body: string) => void;
  set: (headerName: string, value: string | number) => void;
  sendStatus: (code: number) => void;
  status: (code: number) => HttpResponse;
}

export type HttpNext = (error?: unknown) => void;
export type HttpHandler = (
  request: HttpRequest,
  response: HttpResponse,
  next: HttpNext
) => void | Promise<void>;

export interface HttpRouteBuilder {
  delete: (handler: HttpHandler) => HttpRouteBuilder;
  get: (handler: HttpHandler) => HttpRouteBuilder;
  patch: (handler: HttpHandler) => HttpRouteBuilder;
  post: (handler: HttpHandler) => HttpRouteBuilder;
  put: (handler: HttpHandler) => HttpRouteBuilder;
}

export interface HttpRouter {
  route: (path: string) => HttpRouteBuilder;
  use: (pathOrHandler: string | HttpHandler | HttpRouter, value?: HttpHandler | HttpRouter) => void;
}

export interface HttpApp extends HttpRouter {
  handle: (req: IncomingMessage, res: ServerResponse) => void;
  listen: (port: number, callback?: () => void) => import('node:http').Server;
}
