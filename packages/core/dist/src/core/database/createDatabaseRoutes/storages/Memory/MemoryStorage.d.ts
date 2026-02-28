import type { Storage, StorageIndex } from '../../../../../utils/types';
export declare class MemoryStorage<Data extends Record<StorageIndex, any> = Record<StorageIndex, any>> implements Storage {
    private readonly data;
    constructor(initialData: Data);
    read(key?: StorageIndex | StorageIndex[]): any;
    write(key: StorageIndex | StorageIndex[], value: unknown): void;
    delete(key: StorageIndex | StorageIndex[]): void;
}
