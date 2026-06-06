import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTmpDir } from '@/utils/helpers/tests';

import { createFileHandler } from './createFileHandler';

const createParams = () =>
  ({
    response: {
      send: vi.fn(),
      type: vi.fn()
    },
    next: vi.fn(() => null),
    setHeader: vi.fn(),
    setStatusCode: vi.fn()
  }) as any;

describe('createFileHandler', () => {
  let tmpDirPath: string;

  beforeEach(() => {
    tmpDirPath = createTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDirPath, { recursive: true, force: true });
  });

  it('Should return 404 when file path is invalid', () => {
    const notExistedFilePath = path.join(tmpDirPath, './missing.json');
    const params = createParams();
    const fileHandler = createFileHandler(notExistedFilePath);

    const result = fileHandler(params);

    expect(params.next).toHaveBeenCalledTimes(1);
    expect(params.setStatusCode).not.toHaveBeenCalled();
    expect(params.response.send).not.toHaveBeenCalled();
    expect(params.response.type).not.toHaveBeenCalled();
    expect(params.setHeader).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('Should read file and return buffer when file path is valid', () => {
    const fileContent = JSON.stringify({ user: 'John Doe' });
    const existedFilePath = path.join(tmpDirPath, './user.json');
    fs.writeFileSync(existedFilePath, fileContent);

    const params = createParams();
    const fileHandler = createFileHandler(existedFilePath);

    const result = fileHandler(params);

    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result).toStrictEqual(Buffer.from(fileContent));
    expect(params.setStatusCode).not.toHaveBeenCalled();
    expect(params.response.send).not.toHaveBeenCalled();
  });

  it('Should set content type and content disposition headers from file path', () => {
    const existedFilePath = path.join(tmpDirPath, './document.txt');
    fs.writeFileSync(existedFilePath, 'content');

    const params = createParams();
    const fileHandler = createFileHandler(existedFilePath);

    fileHandler(params);

    expect(params.response.type).toHaveBeenCalledWith('txt');
    expect(params.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="document.txt"'
    );
  });
});
