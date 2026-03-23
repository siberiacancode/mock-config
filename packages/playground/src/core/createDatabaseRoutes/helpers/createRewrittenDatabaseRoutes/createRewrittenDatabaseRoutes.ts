import type { IRouter } from 'express';

import rewrite from 'express-urlrewrite';

export const createRewrittenDatabaseRoutes = (
  router: IRouter,
  rewrittenRoutes: Record<string, string>
) =>
  Object.entries(rewrittenRoutes).forEach(([key, value]) => {
    router.use(rewrite(key, value));
  });
