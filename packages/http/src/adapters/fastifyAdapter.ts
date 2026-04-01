import type { HttpApp } from '../types';

interface FastifyLikeRequest {
  raw: any;
}

interface FastifyLikeReply {
  hijack?: () => void;
  raw: any;
}

interface FastifyLikeServer {
  all?: (path: string, handler: (request: FastifyLikeRequest, reply: FastifyLikeReply) => unknown) => unknown;
  route?: (config: {
    method: string[];
    url: string;
    handler: (request: FastifyLikeRequest, reply: FastifyLikeReply) => unknown;
  }) => unknown;
}

const ALL_METHODS = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'];

export const fastifyAdapter = (
  server: FastifyLikeServer,
  app: HttpApp,
  mountPath: string = '/'
) => {
  const handler = async (request: FastifyLikeRequest, reply: FastifyLikeReply) => {
    await app.handle(request.raw, reply.raw);
    reply.hijack?.();
    return reply;
  };

  if (typeof server.all === 'function') {
    server.all(`${mountPath}*`, handler);
    return server;
  }

  server.route?.({
    method: ALL_METHODS,
    url: `${mountPath}*`,
    handler
  });

  return server;
};
