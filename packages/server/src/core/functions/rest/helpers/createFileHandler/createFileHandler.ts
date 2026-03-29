import fs from 'node:fs';
import path from 'node:path';

import type { RestDataResponse, RestFileResponse, RestMethod } from '@/utils/types';

import { isFilePathValid } from '@/utils/helpers';

export const createFileHandler =
  <Method extends RestMethod>(
    filePath: RestFileResponse
  ): Extract<RestDataResponse<Method>, (...args: any[]) => any> =>
  ({ response, setHeader, setStatusCode }) => {
    if (!isFilePathValid(filePath)) {
      // TODO: what should we do?
      setStatusCode(404);
      response.send('Not Found');
      return null;
    }

    const buffer = fs.readFileSync(path.resolve(filePath));
    const fileName = filePath.replaceAll('\\', '/').split('/').at(-1)!;
    const fileExtension = fileName.split('.').at(-1)!;

    response.type(fileExtension);
    setHeader('Content-Disposition', `filename=${fileName}`);

    return buffer;
  };
