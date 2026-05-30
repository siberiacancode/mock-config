import path from 'node:path';

export const urlJoin = (...paths: string[]) =>
  path.posix.join(...paths.map((path) => path.replace(/^\\\\\?\\/, '').replace(/\\/g, '/')));
