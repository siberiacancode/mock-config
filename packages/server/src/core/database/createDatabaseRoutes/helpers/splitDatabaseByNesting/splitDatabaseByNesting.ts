import type {
  DatabaseConfig,
  NestedDatabase,
  NestedDatabaseId,
  ShallowDatabase
} from '@/utils/types';

import { isPlainObject } from '@/utils/helpers';

const isAllArrayElementsHaveValidTypeId = (array: unknown[]) =>
  array.every(
    (element) =>
      isPlainObject(element) && (typeof element.id === 'number' || typeof element.id === 'string')
  );

const isAllArrayElementsHaveUniqueId = (array: { id: NestedDatabaseId }[]) => {
  const uniqueIdsCount = new Set(array.map(({ id }) => id)).size;
  return array.length === uniqueIdsCount;
};

export const splitDatabaseByNesting = (data: DatabaseConfig['data']) => {
  const shallowDatabase: ShallowDatabase = {};
  const nestedDatabase: NestedDatabase = {};

  Object.entries(data).forEach(([databaseEntityKey, databaseEntityValue]) => {
    if (
      Array.isArray(databaseEntityValue) &&
      isAllArrayElementsHaveValidTypeId(databaseEntityValue) &&
      isAllArrayElementsHaveUniqueId(databaseEntityValue)
    ) {
      nestedDatabase[databaseEntityKey] = databaseEntityValue;
      return;
    }
    shallowDatabase[databaseEntityKey] = databaseEntityValue;
  });

  return { shallowDatabase, nestedDatabase };
};
