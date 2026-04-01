import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import type { HttpApp, HttpHandler, HttpRequest, HttpResponse, HttpRouteBuilder, HttpRouter } from '../types';

type RouteMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

interface CompiledPath {
  matcher: RegExp;
  params: string[];
}

interface RouteEntry {
  method: RouteMethod;
  compiledPath: CompiledPath;
  handler: HttpHandler;
}

interface MountEntry {
  handler: HttpHandler | NodeRouter;
  path: string;
}

const isMountedPathMatched = (path: string, mountPath: string) =>
  mountPath === '/' || path === mountPath || path.startsWith(`${mountPath}/`);

const toQuery = (url: URL) => {
  const query: Record<string, string | string[] | undefined> = {};
  url.searchParams.forEach((value, key) => {
    const existingValue = query[key];
    if (existingValue === undefined) {
      query[key] = value;
      return;
    }
    if (Array.isArray(existingValue)) {
      existingValue.push(value);
      query[key] = existingValue;
      return;
    }
    query[key] = [existingValue, value];
  });
  return query;
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const compilePath = (path: string): CompiledPath => {
  const normalizedPath = path === '/' ? '/' : path.replace(/\/+$/, '');
  const segments = normalizedPath.split('/').filter(Boolean);
  const params: string[] = [];

  const pattern = segments
    .map((segment) => {
      if (segment.startsWith(':')) {
        params.push(segment.slice(1));
        return '([^/]+)';
      }
      return escapeRegExp(segment);
    })
    .join('/');

  return {
    matcher: new RegExp(`^/${pattern}${normalizedPath === '/' ? '' : ''}$`),
    params
  };
};

const normalizePath = (path: string) => {
  if (!path) return '/';
  if (!path.startsWith('/')) return `/${path}`;
  return path;
};

class NodeRouteBuilder implements HttpRouteBuilder {
  public constructor(
    private readonly path: string,
    private readonly register: (method: RouteMethod, path: string, handler: HttpHandler) => void
  ) {}

  public delete(handler: HttpHandler) {
    this.register('DELETE', this.path, handler);
    return this;
  }
  public get(handler: HttpHandler) {
    this.register('GET', this.path, handler);
    return this;
  }
  public patch(handler: HttpHandler) {
    this.register('PATCH', this.path, handler);
    return this;
  }
  public post(handler: HttpHandler) {
    this.register('POST', this.path, handler);
    return this;
  }
  public put(handler: HttpHandler) {
    this.register('PUT', this.path, handler);
    return this;
  }
}

class NodeRouter implements HttpRouter {
  public readonly mounts: MountEntry[] = [];
  public readonly routes: RouteEntry[] = [];

  public route(path: string): HttpRouteBuilder {
    const normalizedPath = normalizePath(path);
    return new NodeRouteBuilder(normalizedPath, (method, routePath, handler) => {
      this.routes.push({ method, handler, compiledPath: compilePath(routePath) });
    });
  }

  public use(pathOrHandler: string | HttpHandler | HttpRouter, value?: HttpHandler | HttpRouter) {
    if (typeof pathOrHandler === 'string') {
      if (!value) return;
      this.mounts.push({ path: normalizePath(pathOrHandler), handler: value as HttpHandler | NodeRouter });
      return;
    }

    this.mounts.push({ path: '/', handler: pathOrHandler as HttpHandler | NodeRouter });
  }
}

const buildRequest = (raw: IncomingMessage): HttpRequest => {
  const originalUrl = raw.url ?? '/';
  const url = new URL(originalUrl, `http://${raw.headers.host ?? 'localhost'}`);
  const protocol = raw.socket.encrypted ? 'https' : 'http';
  return {
    cookies: {},
    get: (headerName) => {
      const value = raw.headers[headerName.toLowerCase()];
      if (Array.isArray(value)) return value.join(', ');
      return value;
    },
    headers: raw.headers,
    method: raw.method?.toUpperCase() ?? 'GET',
    originalUrl,
    params: {},
    path: url.pathname,
    protocol,
    query: toQuery(url),
    raw,
    url: originalUrl
  };
};

const buildResponse = (raw: ServerResponse): HttpResponse => {
  const response: HttpResponse = {
    end: (body) => raw.end(body),
    json: (body) => {
      raw.setHeader('Content-Type', 'application/json; charset=utf-8');
      raw.end(JSON.stringify(body));
    },
    links: (links) => {
      const linkValue = Object.entries(links)
        .map(([name, value]) => `<${value}>; rel="${name}"`)
        .join(', ');
      raw.setHeader('Link', linkValue);
    },
    raw,
    send: (body) => raw.end(body),
    set: (headerName, value) => {
      raw.setHeader(headerName, value);
    },
    sendStatus: (code) => {
      raw.statusCode = code;
      raw.end();
    },
    status: (code) => {
      raw.statusCode = code;
      return response;
    }
  };
  return response;
};

const parseBody = async (request: HttpRequest) => {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;

  const contentType = request.get('content-type') ?? '';
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    request.raw.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.raw.on('end', () => resolve());
    request.raw.on('error', reject);
  });

  const rawBody = Buffer.concat(chunks).toString('utf-8');
  if (!rawBody) return undefined;

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return undefined;
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawBody);
    const output: Record<string, string | string[]> = {};
    params.forEach((value, key) => {
      const existingValue = output[key];
      if (!existingValue) {
        output[key] = value;
        return;
      }
      if (Array.isArray(existingValue)) {
        existingValue.push(value);
        output[key] = existingValue;
        return;
      }
      output[key] = [existingValue, value];
    });
    return output;
  }

  return rawBody;
};

const matchRoute = (route: RouteEntry, path: string) => {
  const match = route.compiledPath.matcher.exec(path);
  if (!match) return null;
  const params: Record<string, string> = {};
  route.compiledPath.params.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1] ?? '');
  });
  return params;
};

const runHandler = async (
  handler: HttpHandler,
  request: HttpRequest,
  response: HttpResponse
): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const next = (error?: unknown) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(undefined);
    };

    Promise.resolve(handler(request, response, next)).then(resolve).catch(reject);
  });

const runRouter = async (
  router: NodeRouter,
  request: HttpRequest,
  response: HttpResponse
): Promise<boolean> => {
  for (const mount of router.mounts) {
    if (!isMountedPathMatched(request.path, mount.path)) continue;

    if (mount.handler instanceof NodeRouter) {
      const originalPath = request.path;
      const originalUrl = request.url;
      const [, query = ''] = request.url.split('?');
      const nextPath = request.path.slice(mount.path.length) || '/';
      request.path = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
      request.url = query ? `${request.path}?${query}` : request.path;

      const isHandled = await runRouter(mount.handler, request, response);

      request.path = originalPath;
      request.url = originalUrl;
      if (isHandled) return true;
      continue;
    }

    await runHandler(mount.handler, request, response);
    if (response.raw.writableEnded) return true;
  }

  for (const route of router.routes) {
    if (route.method !== request.method) continue;
    const params = matchRoute(route, request.path);
    if (!params) continue;
    request.params = params;
    await runHandler(route.handler, request, response);
    if (response.raw.writableEnded) return true;
  }

  return response.raw.writableEnded;
};

class NodeApp extends NodeRouter implements HttpApp {
  public handle = async (rawRequest: IncomingMessage, rawResponse: ServerResponse) => {
    const request = buildRequest(rawRequest);
    const response = buildResponse(rawResponse);
    request.body = await parseBody(request);

    try {
      const handled = await runRouter(this, request, response);
      if (!handled && !rawResponse.writableEnded) {
        rawResponse.statusCode = 404;
        rawResponse.end();
      }
    } catch (error) {
      if (rawResponse.writableEnded) return;
      rawResponse.statusCode = 500;
      rawResponse.end((error as Error).stack ?? 'Internal server error');
    }
  };

  public listen(port: number, callback?: () => void): Server {
    const server = createServer(this.handle);
    return server.listen(port, callback);
  }
}

export const createNodeApp = (): HttpApp => new NodeApp();
export const createNodeRouter = (): HttpRouter => new NodeRouter();
