import type { IRouter } from 'express';

import type { DatabaseConfig, NestedDatabase, ShallowDatabase } from '@/utils/types';

import { createStorage } from '../createStorage/createStorage';
import {
  createNestedDatabaseRoutes,
  createRewrittenDatabaseRoutes,
  createShallowDatabaseRoutes,
  splitDatabaseByNesting
} from './helpers';
import { FileStorage, MemoryStorage } from './storages';

const isVariableJsonFile = (variable: unknown): variable is `${string}.json` =>
  typeof variable === 'string' && variable.endsWith('.json');

export const createDatabaseRoutes = (router: IRouter, { data, routes }: DatabaseConfig) => {
  console.log(data, routes);

  if (routes) {
    const storage = createStorage(routes);
    createRewrittenDatabaseRoutes(router, storage.read());

    router.route('/__routes').get((_request, response) => {
      response.json(storage.read());
    });
  }

  const storage = isVariableJsonFile(data) ? new FileStorage(data) : new MemoryStorage(data);
  const { shallowDatabase, nestedDatabase } = splitDatabaseByNesting(storage.read());
  createShallowDatabaseRoutes(router, shallowDatabase, storage as MemoryStorage<ShallowDatabase>);
  createNestedDatabaseRoutes(router, nestedDatabase, storage as MemoryStorage<NestedDatabase>);

  router.route('/__db').get((_request, response) => {
    response.json(storage.read());
  });

  return router;
};
