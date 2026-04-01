import fs from 'node:fs';
import path from 'node:path';

import type { RestDataResponseFunction, RestFileResponse, RestMethod } from '@/utils/types';

import { isFilePathValid } from '@/utils/helpers';

export const createFileHandler =
  <Method extends RestMethod>(filePath: RestFileResponse): RestDataResponseFunction<Method> =>
  ({ response, setHeader, next }) => {
    if (!isFilePathValid(filePath)) {
      return next();
    }

    const buffer = fs.readFileSync(path.resolve(filePath));
    const fileName = filePath.replaceAll('\\', '/').split('/').at(-1)!;
    const fileExtension = fileName.split('.').at(-1)!;

    response.type(fileExtension);
    setHeader('Content-Disposition', `filename=${fileName}`);

    return buffer;
  };
