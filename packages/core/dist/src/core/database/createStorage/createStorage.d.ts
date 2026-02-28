import { FileStorage, MemoryStorage } from '../createDatabaseRoutes/storages';
export declare const createStorage: <Data extends `${string}.json` | Record<string, unknown>>(data: Data) => FileStorage<Record<import("../../..").StorageIndex, any>> | MemoryStorage<Record<import("../../..").StorageIndex, any>>;
