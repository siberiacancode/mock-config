import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect
} from '@tanstack/react-router';

import { RootLayout } from './layouts/RootLayout';
import {
  ComponentPage,
  ComponentsPage,
  RequestPage,
  RoutesIndexPage,
  RoutesPage,
  SettingsPage
} from './pages';

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
    throw redirect({ to: '/routes' });
  }
});

const routesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/routes',
  component: RoutesPage,
  validateSearch: (
    search: Record<string, string>
  ): {
    query?: string;
  } => ({
    query: search.query ?? undefined
  })
});

const routesIndexRoute = createRoute({
  getParentRoute: () => routesRoute,
  path: '/',
  component: RoutesIndexPage
});

const requestRoute = createRoute({
  getParentRoute: () => routesRoute,
  path: '$requestId',
  component: RequestPage
});

const componentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/components'
});

const componentsIndexRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: '/',
  component: ComponentsPage
});

const componentRoute = createRoute({
  getParentRoute: () => componentsRoute,
  path: '$componentId',
  component: ComponentPage
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  routesRoute.addChildren([routesIndexRoute, requestRoute]),
  componentsRoute.addChildren([componentsIndexRoute, componentRoute]),
  settingsRoute
]);

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
