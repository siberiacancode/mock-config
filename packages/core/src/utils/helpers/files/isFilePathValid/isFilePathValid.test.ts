import fs from 'node:fs';
import path from 'node:path';

import { createTmpDir } from '../../tests';
import { isFilePathValid } from './isFilePathValid';

describe('isFilePathValid', () => {
  let tmpDirPath: string;

  beforeEach(() => {
    tmpDirPath = createTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDirPath, { recursive: true, force: true });
  });

  it('Should return true only for existed files', () => {
    const notExistedFilePath = path.join(tmpDirPath, './notExistedFile.json');
    expect(isFilePathValid(notExistedFilePath)).toBe(false);

    const existedFilePath = path.join(tmpDirPath, './existedFile.json');
    fs.writeFileSync(existedFilePath, JSON.stringify({ some: 'data' }));
    expect(isFilePathValid(existedFilePath)).toBe(true);
  });

  it('Should return true only for files (not directories, etc.)', () => {
    expect(isFilePathValid(tmpDirPath)).toBe(false);

    const existedFilePath = path.join(tmpDirPath, './existedFile.json');
    fs.writeFileSync(existedFilePath, JSON.stringify({ some: 'data' }));
    expect(isFilePathValid(existedFilePath)).toBe(true);
  });
});
