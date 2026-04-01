import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { BaseUrl, Cors, HttpApp, HttpHandler, StaticPath } from './types';

const DEFAULT = {
  CORS: {
    ORIGIN: '*',
    METHODS: 'GET,OPTIONS,PUT,PATCH,POST,DELETE',
    ALLOWED_HEADERS: '*',
    EXPOSED_HEADERS: '*',
    CREDENTIALS: true,
    MAX_AGE: 3600
  }
};

const convertWin32PathToUnix = (pathToConvert: string) => pathToConvert.replaceAll('\\', '/');

const urlJoin = (...paths: string[]) => {
  const pathsToJoin =
    os.platform() === 'win32' ? paths.map((pathPart) => convertWin32PathToUnix(pathPart)) : paths;
  return path.posix.join(...pathsToJoin);
};

const parseCookie = (cookieHeader: string) => {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (!name) return;
    cookies[name.trim()] = value?.trim() ?? '';
  });
  return cookies;
};

const mimeByExtension: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

const getAllowedOrigins = (origin: Cors['origin']) => (Array.isArray(origin) ? origin : [origin]);
const withLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

const createStaticHandler = (staticRoot: string): HttpHandler => (request, response, next) => {
  const safePath = path.normalize(request.path).replace(/^(\.\.[\/\\])+/, '');
  const targetPath = path.join(staticRoot, safePath);
  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) return next();

  const extension = path.extname(targetPath).toLowerCase();
  response.set('Content-Type', mimeByExtension[extension] ?? 'application/octet-stream');
  response.raw.statusCode = 200;
  fs.createReadStream(targetPath).pipe(response.raw);
};

export const cookieParseMiddleware = (server: HttpApp) => {
  server.use((request, _response, next) => {
    request.cookies = parseCookie(request.get('cookie') ?? '');
    next();
  });
};

export const corsMiddleware = (server: HttpApp, cors: Cors) => {
  server.use(async (request, response, next) => {
    if (Array.isArray(cors.origin) && !cors.origin.length) return next();

    const allowedOrigins =
      typeof cors.origin === 'function'
        ? getAllowedOrigins(await cors.origin(request))
        : getAllowedOrigins(cors.origin);

    const origin = request.headers.origin;
    if (!allowedOrigins.length || !origin) return next();

    const isAllowed = allowedOrigins.some((allowedOrigin) =>
      allowedOrigin instanceof RegExp ? allowedOrigin.test(origin) : allowedOrigin === origin
    );
    if (!isAllowed) return next();

    response.set('Access-Control-Allow-Origin', origin);
    response.set('Access-Control-Allow-Credentials', `${cors.credentials ?? DEFAULT.CORS.CREDENTIALS}`);
    response.set('Access-Control-Expose-Headers', `${cors.exposedHeaders ?? DEFAULT.CORS.EXPOSED_HEADERS}`);

    if (request.method === 'OPTIONS') {
      response.set('Access-Control-Allow-Methods', `${cors.methods ?? DEFAULT.CORS.METHODS}`);
      response.set('Access-Control-Allow-Headers', `${cors.allowedHeaders ?? DEFAULT.CORS.ALLOWED_HEADERS}`);
      response.set('Access-Control-Max-Age', `${cors.maxAge ?? DEFAULT.CORS.MAX_AGE}`);
      response.sendStatus(204);
      return;
    }

    next();
  });
};

export const noCorsMiddleware = (server: HttpApp) => {
  server.use((request, response, next) => {
    response.set('Access-Control-Allow-Origin', DEFAULT.CORS.ORIGIN);
    response.set('Access-Control-Allow-Credentials', `${DEFAULT.CORS.CREDENTIALS}`);
    response.set('Access-Control-Expose-Headers', DEFAULT.CORS.EXPOSED_HEADERS);

    const isPreflightRequest =
      request.method === 'OPTIONS' &&
      request.headers.origin &&
      request.headers['access-control-request-method'] &&
      request.headers['access-control-request-headers'];

    if (isPreflightRequest) {
      response.set('Access-Control-Allow-Methods', DEFAULT.CORS.METHODS);
      response.set('Access-Control-Allow-Headers', DEFAULT.CORS.ALLOWED_HEADERS);
      response.set('Access-Control-Max-Age', `${DEFAULT.CORS.MAX_AGE}`);
      response.sendStatus(204);
      return;
    }

    next();
  });
};

export const staticMiddleware = (
  server: HttpApp,
  baseUrl: BaseUrl,
  staticPath: StaticPath,
  appPath: string
) => {
  const registerPath = (prefix: string, filePath: string) => {
    const mountPath = withLeadingSlash(urlJoin(baseUrl, prefix));
    const staticRoot = urlJoin(appPath, filePath);
    server.use(mountPath, createStaticHandler(staticRoot));
  };

  if (Array.isArray(staticPath)) {
    staticPath.forEach((entry) => {
      if (typeof entry === 'object') {
        registerPath(entry.prefix, entry.path);
        return;
      }
      registerPath('/', entry);
    });
    return;
  }

  if (typeof staticPath === 'object') {
    registerPath(staticPath.prefix, staticPath.path);
    return;
  }

  registerPath('/', staticPath);
};

export const errorMiddleware = (_server: HttpApp) => {};
