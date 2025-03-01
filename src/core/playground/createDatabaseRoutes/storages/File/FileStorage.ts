import fs from 'node:fs';
import path from 'node:path';

import type { Storage, StorageIndex } from '@/utils/types';

import { APP_PATH } from '@/utils/constants';

import { isIndex } from '../../helpers';
import { FileWriter } from './FileWriter';

export class FileStorage<Data extends Record<StorageIndex, any> = Record<StorageIndex, any>>
  implements Storage
{
  private readonly fileWriter: FileWriter;

  private readonly data: Data;

  public constructor(fileName: string) {
    const filePath = path.resolve(APP_PATH, fileName);
    this.fileWriter = new FileWriter(filePath);
    this.data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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

    this.fileWriter.write(JSON.stringify(this.data));
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
    } else {
      delete deletable[keys[index]];
    }

    this.fileWriter.write(JSON.stringify(this.data));
  }
}
