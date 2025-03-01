import type { NestedDatabaseId } from '@/utils/types';

export const findIndexById = (array: { id: NestedDatabaseId }[], id: NestedDatabaseId) =>
  array.findIndex((item) => item.id.toString() === id.toString());
