export interface Database extends Record<string, unknown> {}
export type ShallowDatabase = Record<string, unknown>;

export type NestedDatabaseId = number | string;
export type NestedDatabase = Record<string, { id: NestedDatabaseId; [key: string]: unknown }[]>;

export type StorageIndex = number | string;
export interface Storage {
  delete: (key: StorageIndex | StorageIndex[]) => void;
  read: (key?: StorageIndex | StorageIndex[]) => any;
  write: (key: StorageIndex | StorageIndex[], value: unknown) => void;
}

export interface ShallowOrm<Item = unknown> {
  get: () => Item;
  update: (data: Item) => void;
}

export interface NestedOrm<Item = Record<string, unknown>> {
  count: () => number;
  create: (item: Omit<Item, 'id'>) => Item;
  createMany: (items: Omit<Item, 'id'>[]) => void;

  delete: (id: StorageIndex) => void;
  deleteMany: (ids: StorageIndex[]) => void;
  exists: (filters: Partial<Item>) => boolean;

  findById: (id: StorageIndex) => Item | undefined;
  findFirst: (filters?: Partial<Item>) => Item | undefined;
  findMany: (filters?: Partial<Item>) => Item[];
  update: (id: StorageIndex, item: Partial<Omit<Item, 'id'>>) => void;

  updateMany: (ids: StorageIndex[], item: Partial<Omit<Item, 'id'>>) => number;
}

export type Orm<Database extends Record<string, unknown>> = {
  [Key in keyof Database]: Database[Key] extends Array<infer Item>
    ? Item extends { id: StorageIndex }
      ? NestedOrm<Item>
      : ShallowOrm<Database[Key]>
    : ShallowOrm<Database[Key]>;
};
