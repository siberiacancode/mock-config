import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTmpDir } from '@/utils/helpers/tests';

import { FileWriter } from './FileWriter';

describe('FileWriter', () => {
  let tmpDirPath: string;

  beforeEach(() => {
    tmpDirPath = createTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDirPath, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('Write asynchronously in file only last data (before Promise become fulfilled)', async () => {
    const fileName = './database.json';
    const filePath = path.join(tmpDirPath, fileName);
    const fileWriter = new FileWriter(filePath);

    const writePromises: Promise<void>[] = [];
    const writeOperationCount = 100;
    for (let i = 0; i <= writeOperationCount; i += 1) {
      writePromises.push(fileWriter.write(JSON.stringify({ index: i })));
    }
    await Promise.all(writePromises);

    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(fileData).toStrictEqual({ index: writeOperationCount });
  });

  it('Write in file only if writing is unlocked (first write and last write)', async () => {
    const fileWriter = new FileWriter(path.join(tmpDirPath, './database.json'));
    const fsPromisesWriteFileMock = vi.spyOn(fs.promises, 'writeFile');

    const writePromises: Promise<void>[] = [];
    const writeOperationCount = 100;
    for (let i = 0; i <= writeOperationCount; i += 1) {
      writePromises.push(fileWriter.write(JSON.stringify({ index: i })));
    }
    await Promise.all(writePromises);

    expect(fsPromisesWriteFileMock).toHaveBeenCalledTimes(2);
  });
});
