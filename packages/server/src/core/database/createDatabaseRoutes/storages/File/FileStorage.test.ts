import fs from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTmpDir } from '@/utils/helpers/tests';

import { FileStorage } from './FileStorage';
import { FileWriter } from './FileWriter';

vi.mock('./FileWriter');
const fileWriterWriteMethodMock = vi.spyOn(FileWriter.prototype, 'write');

describe('FileStorage', () => {
  const createInitialData = () => ({
    john: { name: 'John Doe', age: 25 },
    jane: { name: 'Jane Smith', age: 30 },
    users: [{ id: 1 }, { id: 2 }]
  });

  describe('FileStorage: read', () => {
    let tmpDirPath: string;
    let initialData: ReturnType<typeof createInitialData>;
    let fileStorage: FileStorage;

    beforeAll(() => {
      tmpDirPath = createTmpDir();
      initialData = createInitialData();

      const pathToFileStorage = path.join(tmpDirPath, './database.json');
      fs.writeFileSync(pathToFileStorage, JSON.stringify(initialData));
      fileStorage = new FileStorage(pathToFileStorage);
    });

    afterAll(() => {
      fs.rmSync(tmpDirPath, { recursive: true, force: true });
      vi.clearAllMocks();
    });

    it('Should return correct full data for read without keys', () => {
      expect(fileStorage.read()).toStrictEqual(initialData);
    });

    it('Should return correct data for read with valid single key', () => {
      expect(fileStorage.read('john')).toStrictEqual(initialData.john);
    });

    it('Should return correct data for read with valid array key', () => {
      expect(fileStorage.read(['john', 'name'])).toStrictEqual(initialData.john.name);
    });
  });

  describe('FileStorage: write', () => {
    let tmpDirPath: string;
    let initialData: ReturnType<typeof createInitialData>;
    let fileStorage: FileStorage;

    beforeEach(() => {
      tmpDirPath = createTmpDir();
      initialData = createInitialData();

      const pathToFileStorage = path.join(tmpDirPath, './database.json');
      fs.writeFileSync(pathToFileStorage, JSON.stringify(initialData));
      fileStorage = new FileStorage(pathToFileStorage);
    });

    afterEach(() => {
      fs.rmSync(tmpDirPath, { recursive: true, force: true });
      vi.clearAllMocks();
    });

    it('Should update value with valid single key', () => {
      const johnWithNewAge = { ...initialData.john, age: initialData.john.age + 1 };

      fileStorage.write('john', johnWithNewAge);

      expect(fileStorage.read('john')).toStrictEqual(johnWithNewAge);
    });

    it('Should update value with valid array key', () => {
      const newAge = initialData.john.age + 1;

      fileStorage.write(['john', 'age'], newAge);

      expect(fileStorage.read(['john', 'age'])).toBe(newAge);
    });

    it('Should update value with valid key which contain non-existent last part', () => {
      const stand = 'The World';

      fileStorage.write(['john', 'stand'], stand);

      expect(fileStorage.read(['john', 'stand'])).toBe(stand);
    });

    it('Should write in file updated data', () => {
      fileStorage.write(['john', 'stand'], 'The World');

      expect(fileWriterWriteMethodMock).toHaveBeenCalledTimes(1);
      expect(fileWriterWriteMethodMock).toHaveBeenCalledWith(JSON.stringify(fileStorage.read()));
    });
  });

  describe('FileStorage: delete', () => {
    let tmpDirPath: string;
    let initialData: ReturnType<typeof createInitialData>;
    let fileStorage: FileStorage;

    beforeEach(() => {
      tmpDirPath = createTmpDir();
      initialData = createInitialData();

      const pathToFileStorage = path.join(tmpDirPath, './database.json');
      fs.writeFileSync(pathToFileStorage, JSON.stringify(initialData));
      fileStorage = new FileStorage(pathToFileStorage);
    });

    afterEach(() => {
      fs.rmSync(tmpDirPath, { recursive: true, force: true });
      vi.clearAllMocks();
    });

    it('Should correctly delete object property with valid single key', () => {
      expect(fileStorage.read('john')).toStrictEqual(initialData.john);

      fileStorage.delete('john');

      expect(fileStorage.read('john')).toBe(undefined);
    });

    it('Should correctly delete object property with valid array key', () => {
      expect(fileStorage.read('john')).toStrictEqual(initialData.john);

      fileStorage.delete(['john', 'age']);

      expect(fileStorage.read('john')).toStrictEqual({ name: initialData.john.name });
    });

    it('Should splice array if delete element from array', () => {
      expect(fileStorage.read('users')).toStrictEqual(initialData.users);

      fileStorage.delete(['users', 0]);

      const updatedUsers = fileStorage.read('users');
      expect(updatedUsers).toStrictEqual([{ id: 2 }]);
      expect(updatedUsers.length).toBe(1);
    });

    it('Should write in file updated data', () => {
      fileStorage.delete(['users', 0]);

      expect(fileWriterWriteMethodMock).toHaveBeenCalledTimes(1);
      expect(fileWriterWriteMethodMock).toHaveBeenCalledWith(JSON.stringify(fileStorage.read()));
    });
  });
});
