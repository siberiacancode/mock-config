import type { HttpRouter } from 'mock-config-http';

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const compileMatcher = (path: string) => {
  const keys: string[] = [];
  const pattern = path
    .split('/')
    .map((segment) => {
      if (!segment) return '';
      if (segment === '*') {
        keys.push('*');
        return '(.+)';
      }
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return escapeRegExp(segment);
    })
    .join('/');

  return { keys, matcher: new RegExp(`^${pattern.startsWith('/') ? '' : '/'}${pattern}$`) };
};

const replaceByParams = (template: string, keys: string[], values: string[]) => {
  let output = template;
  keys.forEach((key, index) => {
    const value = values[index] ?? '';
    if (key === '*') {
      output = output.replace('*', value);
      return;
    }
    output = output.replace(`:${key}`, value);
  });
  return output;
};

export const createRewrittenDatabaseRoutes = (
  router: HttpRouter,
  rewrittenRoutes: Record<string, string>
) =>
  Object.entries(rewrittenRoutes).forEach(([key, value]) => {
    const { matcher, keys } = compileMatcher(key);
    router.use((request, _response, next) => {
      const pathWithoutQuery = request.path;
      const match = matcher.exec(pathWithoutQuery);
      if (!match) return next();

      const targetPath = replaceByParams(value, keys, match.slice(1));
      const [, query = ''] = request.url.split('?');
      request.path = targetPath;
      request.url = query ? `${targetPath}?${query}` : targetPath;
      const searchParams = new URLSearchParams(query);
      const nextQuery: Record<string, string | string[]> = {};
      searchParams.forEach((paramValue, paramName) => {
        const currentValue = nextQuery[paramName];
        if (currentValue === undefined) {
          nextQuery[paramName] = paramValue;
          return;
        }
        if (Array.isArray(currentValue)) {
          currentValue.push(paramValue);
          nextQuery[paramName] = currentValue;
          return;
        }
        nextQuery[paramName] = [currentValue, paramValue];
      });
      request.query = nextQuery;
      return next();
    });
  });
