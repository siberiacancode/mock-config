import type { NestedDatabaseId } from '@/shared/types';

export const findIndexById = (array: { id: NestedDatabaseId }[], id: NestedDatabaseId) =>
  array.findIndex((item) => item.id.toString() === id.toString());
