import { randomBytes } from 'node:crypto';
import { unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const resolveExportsFromSourceCode = async (sourceCode: string, configDirname: string) => {
  const filename = path.join(
    configDirname,
    `mock-server.config.${randomBytes(8).toString('hex')}.mjs`
  );

  await writeFile(filename, sourceCode);
  try {
    return await import(pathToFileURL(filename).href);
  } finally {
    await unlink(filename);
  }
};
