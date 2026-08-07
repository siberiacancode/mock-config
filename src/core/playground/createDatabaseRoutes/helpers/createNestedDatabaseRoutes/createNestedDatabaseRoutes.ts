import type { IRouter } from 'express';
import type { ParsedUrlQuery } from 'node:querystring';

import type { NestedDatabase } from '@/utils/types';

import type { MemoryStorage } from '../../storages';

import { createNewId, findIndexById } from '../array';
import { embed, filter, pagination, search, sort } from '../functions';

export const createNestedDatabaseRoutes = (
  router: IRouter,
  database: NestedDatabase,
  storage: MemoryStorage<NestedDatabase>
) => {
  Object.keys(database).forEach((key) => {
    const collectionPath = `/${key}`;
    const itemPath = `/${key}/:id`;

    router.route(collectionPath).get((request, response) => {
      let data = storage.read(key);

      if (!Array.isArray(data) || !request.query) {
        // ✅ important:
        // set 'Cache-Control' header for explicit browsers response revalidate
        // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
        response.set('Cache-control', 'max-age=0, must-revalidate');
        return response.json(data);
      }

      const { _embed, _page, _limit, _begin, _end, _sort, _order, _q, ...filters } = request.query;

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

      if (_embed) {
        data = embed(database, data, _embed as ParsedUrlQuery);
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

    router.route(collectionPath).post((request, response) => {
      const collection = storage.read(key);
      const newResourceId = createNewId(collection);
      const newResource = { ...request.body, id: newResourceId };
      storage.write([key, collection.length], newResource);
      response.set('Location', `${request.url}/${newResourceId}`);
      response.status(201).json(newResource);
    });

    router.route(itemPath).get((request, response, next) => {
      const currentResourceCollection = storage.read(key);
      const currentResourceIndex = findIndexById(currentResourceCollection, request.params.id);

      if (currentResourceIndex === -1) {
        return next();
      }

      let data = storage.read([key, currentResourceIndex]);

      const { _embed } = request.query;

      if (_embed) {
        data = embed(database, data, _embed as ParsedUrlQuery);
      }

      // ✅ important:
      // set 'Cache-Control' header for explicit browsers response revalidate
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
      response.set('Cache-control', 'no-cache');
      response.json(data);
    });

    router.route(itemPath).put((request, response, next) => {
      const currentResourceCollection = storage.read(key);
      const currentResourceIndex = findIndexById(currentResourceCollection, request.params.id);
      if (currentResourceIndex === -1) {
        return next();
      }

      const currentResource = storage.read([key, currentResourceIndex]);
      const updatedResource = { ...request.body, id: currentResource.id };
      storage.write([key, currentResourceIndex], updatedResource);
      response.json(updatedResource);
    });

    router.route(itemPath).patch((request, response, next) => {
      const currentResourceCollection = storage.read(key);
      const currentResourceIndex = findIndexById(currentResourceCollection, request.params.id);
      if (currentResourceIndex === -1) {
        return next();
      }

      const currentResource = storage.read([key, currentResourceIndex]);
      const updatedResource = { ...currentResource, ...request.body, id: currentResource.id };
      storage.write([key, currentResourceIndex], updatedResource);
      response.json(updatedResource);
    });

    router.route(itemPath).delete((request, response, next) => {
      const currentResourceCollection = storage.read(key);
      const currentResourceIndex = findIndexById(currentResourceCollection, request.params.id);
      if (currentResourceIndex === -1) {
        return next();
      }
      storage.delete([key, currentResourceIndex]);
      response.status(204).end();
    });
  });

  return router;
};
