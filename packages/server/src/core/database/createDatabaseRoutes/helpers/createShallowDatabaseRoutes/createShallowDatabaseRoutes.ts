import type { IRouter } from 'express';
import type { ParsedUrlQuery } from 'node:querystring';

import type { ShallowDatabase } from '@/utils/types';

import type { MemoryStorage } from '../../storages';

import { filter } from '../filter/filter';
import { pagination } from '../pagination/pagination';
import { search } from '../search/search';
import { sort } from '../sort/sort';

export const createShallowDatabaseRoutes = (
  router: IRouter,
  database: ShallowDatabase,
  storage: MemoryStorage<ShallowDatabase>
) => {
  Object.keys(database).forEach((key) => {
    const path = `/${key}`;

    router.route(path).get((request, response) => {
      let data = storage.read(key);

      if (!Array.isArray(data) || !request.query) {
        // ✅ important:
        // set 'Cache-Control' header for explicit browsers response revalidate
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
        response.set('Cache-control', 'no-cache');
        return response.json(data);
      }

      data = data.filter((element) => typeof element === 'object' && element !== null);

      const { _page, _limit, _begin, _end, _sort, _order, _q, ...filters } = request.query;

      if (Object.keys(filters).length) {
        data = filter(data, filters as ParsedUrlQuery);
      }

      if (_q) {
        data = search(data, request.query._q as ParsedUrlQuery);
      }

      if (_sort) {
        data = sort(data, request.query as ParsedUrlQuery);
      }

      if (_begin || _end) {
        data = data.slice(request.query._begin ?? 0, request.query._end);
        response.set('X-Total-Count', data.length);
      }

      // ✅ important:
      // The pagination should be last because it changes the form of the response
      if (_page) {
        data = pagination(data, request.query as ParsedUrlQuery);
        if (data._link) {
          const links = {} as any;
          const fullUrl = `${request.protocol}://${request.get('host')}${request.originalUrl}`;

          if (data._link.first) {
            links.first = fullUrl.replace(`page=${data._link.current}`, `page=${data._link.first}`);
          }
          if (data._link.prev) {
            links.prev = fullUrl.replace(`page=${data._link.current}`, `page=${data._link.prev}`);
          }
          if (data._link.next) {
            links.next = fullUrl.replace(`page=${data._link.current}`, `page=${data._link.next}`);
          }
          if (data._link.last) {
            links.last = fullUrl.replace(`page=${data._link.current}`, `page=${data._link.last}`);
          }

          data._link = { ...data._link, ...links };
          response.links(links);
        }
      }

      // ✅ important:
      // set 'Cache-Control' header for explicit browsers response revalidate
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
      response.set('Cache-control', 'no-cache');
      response.json(data);
    });

    router.route(path).post((request, response) => {
      storage.write(key, request.body);
      response.set('Location', request.url);
      response.status(201).json(request.body);
    });

    router.route(path).put((request, response) => {
      storage.write(key, request.body);
      response.json(request.body);
    });

    router.route(path).patch((request, response) => {
      const currentResource = storage.read(key);
      const updatedResource = { ...currentResource, ...request.body };
      storage.write(key, updatedResource);
      response.json(updatedResource);
    });
  });

  return router;
};
