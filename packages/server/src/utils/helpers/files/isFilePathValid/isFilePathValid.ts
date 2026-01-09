import fs from 'node:fs';

export const isFilePathValid = (path: string) => {
  try {
    if (!fs.existsSync(path)) return false;
    if (!fs.statSync(path).isFile()) return false;

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
