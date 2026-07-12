import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect
} from '@tanstack/react-router';

import { RootLayout } from './layouts/RootLayout';
import { ComponentsPage, RoutesPage, SettingsPage } from './pages';

interface RouterContext {
  payload: Payload;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/components' });
  }
});

const routesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/routes',
  component: RoutesPage
});

const componentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/components',
  component: ComponentsPage
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage
});

const routeTree = rootRoute.addChildren([indexRoute, routesRoute, componentsRoute, settingsRoute]);

export const createAppRouter = (payload: Payload) =>
  createRouter({
    routeTree,
    context: { payload }
  });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
