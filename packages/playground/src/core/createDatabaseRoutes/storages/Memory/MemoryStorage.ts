import type { Storage, StorageIndex } from '@/utils/types';

import { isIndex } from '../../helpers';

export class MemoryStorage<Data extends Record<StorageIndex, any> = Record<StorageIndex, any>>
  implements Storage
{
  private readonly data: Data;

  public constructor(initialData: Data) {
    this.data = initialData;
  }

  public read(key?: StorageIndex | StorageIndex[]): any {
    if (!key) return this.data;
    const keys = Array.isArray(key) ? key : [key];

    let readable: any = this.data;
    for (const currentKey of keys) {
      readable = readable[currentKey];
    }
    return readable;
  }

  public write(key: StorageIndex | StorageIndex[], value: unknown): void {
    const keys = Array.isArray(key) ? key : [key];
    let writable: any = this.data;
    let index = 0;
    // ✅ important:
    // stop iterate one element before end of keys for get access to writable object property
    while (index < keys.length - 1) {
      writable = writable[keys[index]];
      index += 1;
    }
    writable[keys[index]] = value;
  }

  public delete(key: StorageIndex | StorageIndex[]): void {
    const keys = Array.isArray(key) ? key : [key];
    let deletable: any = this.data;
    let index = 0;
    // ✅ important:
    // stop iterate one element before end of key for get access to deletable object property
    while (index < keys.length - 1) {
      deletable = deletable[keys[index]];
      index += 1;
    }

    if (Array.isArray(deletable) && isIndex(keys[index])) {
      deletable.splice(keys[index] as number, 1);
      return;
    }
    delete deletable[keys[index]];
  }
}
