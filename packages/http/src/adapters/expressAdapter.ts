import type { HttpApp } from '../types';

interface ExpressLikeServer {
  use: (path: string, handler: (request: any, response: any) => void) => unknown;
}

export const expressAdapter = (
  server: ExpressLikeServer,
  app: HttpApp,
  mountPath: string = '/'
) => {
  server.use(mountPath, (request, response) => {
    app.handle(request, response);
  });

  return server;
};
