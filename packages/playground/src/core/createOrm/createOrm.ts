import { flatten } from 'flat';

import type { Database, NestedOrm, Orm, ShallowOrm, Storage } from '@/utils/types';

import {
  createNewId,
  findIndexById,
  splitDatabaseByNesting
} from '../createDatabaseRoutes/helpers';

export const createOrm = <Data extends Database = Database>(storage: Storage) => {
  const { shallowDatabase, nestedDatabase } = splitDatabaseByNesting(storage.read());

  const nestedOrm = Object.keys(nestedDatabase).reduce(
    (orm, key) => {
      orm[key] = {
        create: (item) => {
          const collection = storage.read(key);
          const newResourceId = createNewId(collection);
          const newResource = { ...item, id: newResourceId };

          storage.write([key, collection.length], newResource);

          return newResource;
        },
        update: (id, item) => {
          const collection = storage.read(key);
          const currentResourceIndex = findIndexById(collection, id);
          const currentResource = storage.read([key, currentResourceIndex]);
          const updatedResource = { ...currentResource, ...item, id };

          storage.write([key, currentResourceIndex], updatedResource);
        },
        delete: (id) => {
          const collection = storage.read(key);
          const currentResourceIndex = findIndexById(collection, id);

          storage.delete([key, currentResourceIndex]);
        },

        createMany(items) {
          items.forEach((item) => this.create(item));
        },
        updateMany(ids, item) {
          ids.forEach((id) => this.update(id, item));
          return ids.length;
        },
        deleteMany(ids) {
          ids.forEach((id) => this.delete(id));
        },

        findById: (id) => {
          const collection = storage.read(key);
          const currentResourceIndex = findIndexById(collection, id);
          return storage.read([key, currentResourceIndex]);
        },
        findMany: (filters) => {
          const collection = storage.read(key);

          if (!filters) return collection;

          const flattenedFilters = flatten<any, any>(filters);
          return collection.filter((resource: Record<string, unknown>) => {
            const flattenedResource = flatten<any, any>(resource);
            return Object.entries(flattenedFilters).every(
              ([key, value]) => flattenedResource[key] === value
            );
          });
        },
        findFirst: (filters) => {
          const collection = storage.read(key);

          if (!filters) return collection[0];

          const flattenedFilters = flatten<any, any>(filters);
          return collection.find((resource: Record<string, unknown>) => {
            const flattenedResource = flatten<any, any>(resource);
            return Object.entries(flattenedFilters).every(
              ([key, value]) => flattenedResource[key] === value
            );
          });
        },
        exists: (filters) => {
          const collection = storage.read(key);

          const flattenedFilters = flatten<any, any>(filters);
          return collection.some((resource: Record<string, unknown>) => {
            const flattenedResource = flatten<any, any>(resource);
            return Object.entries(flattenedFilters).every(
              ([key, value]) => flattenedResource[key] === value
            );
          });
        },

        count: () => storage.read(key).length
      };

      orm[key].createMany = orm[key].createMany.bind(orm[key]);
      orm[key].updateMany = orm[key].updateMany.bind(orm[key]);
      orm[key].deleteMany = orm[key].deleteMany.bind(orm[key]);
      return orm;
    },
    {} as { [key: string]: NestedOrm }
  );

  const shallowOrm = Object.keys(shallowDatabase).reduce(
    (orm, key) => {
      orm[key] = {
        get: () => storage.read(key),
        update: (data) => {
          storage.write(key, data);
        }
      };

      return orm;
    },
    {} as { [key: string]: ShallowOrm }
  );

  return {
    ...nestedOrm,
    ...shallowOrm
  } as Orm<Data>;
};
