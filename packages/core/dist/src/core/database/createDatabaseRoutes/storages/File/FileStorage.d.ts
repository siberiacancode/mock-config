import type { Storage, StorageIndex } from '../../../../../utils/types';
export declare class FileStorage<Data extends Record<StorageIndex, any> = Record<StorageIndex, any>> implements Storage {
    private readonly fileWriter;
    private readonly data;
    constructor(fileName: string);
    read(key?: StorageIndex | StorageIndex[]): any;
    write(key: StorageIndex | StorageIndex[], value: unknown): void;
    delete(key: StorageIndex | StorageIndex[]): void;
}
