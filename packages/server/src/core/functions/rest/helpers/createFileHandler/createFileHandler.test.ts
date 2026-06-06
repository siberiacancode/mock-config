import type { NativeRestParams } from 'src/server/createNativeMockServer/types';

import fs from 'node:fs';
import path from 'node:path';
import { next } from 'src/server/createNativeMockServer/helpers/routes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTmpDir } from '@/utils/helpers/tests';

import { createFileHandler } from './createFileHandler';

const createParams = () =>
  ({
    setHeader: vi.fn(),
    setStatusCode: vi.fn()
  }) satisfies Partial<NativeRestParams> as any;

describe('createFileHandler', () => {
  let tmpDirPath: string;

  beforeEach(() => {
    tmpDirPath = createTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDirPath, { recursive: true, force: true });
  });

  it('Should throw next error when file path is invalid', () => {
    const notExistedFilePath = path.join(tmpDirPath, './missing.json');
    const params = createParams();
    const fileHandler = createFileHandler(notExistedFilePath);

    expect(() => fileHandler(params)).toThrowError(next());
  });

  it('Should read file and return buffer when file path is valid', async () => {
    const fileContent = JSON.stringify({ user: 'John Doe' });
    const existedFilePath = path.join(tmpDirPath, './user.json');
    fs.writeFileSync(existedFilePath, fileContent);

    const params = createParams();
    const fileHandler = createFileHandler(existedFilePath);

    const response = await fileHandler(params);

    expect(await response.text()).toBe(fileContent);

    expect(params.setHeader).toHaveBeenCalledTimes(2);
    expect(params.setHeader).toHaveBeenNthCalledWith(
      1,
      'Content-Type',
      'application/json; charset=utf-8'
    );
    expect(params.setHeader).toHaveBeenNthCalledWith(
      2,
      'Content-Disposition',
      'attachment; filename="user.json"'
    );
  });
});
