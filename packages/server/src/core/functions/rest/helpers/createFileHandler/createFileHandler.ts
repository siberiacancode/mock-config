import type { NativeRestDataResponseFunction } from 'src/server/createNativeMockServer/types';

import fs from 'node:fs';
import path from 'node:path';
import { next } from 'src/server/createNativeMockServer/helpers/routes';

import type { RestFileResponse } from '@/utils/types';

import { isFilePathValid } from '@/utils/helpers';

const MIME_TYPES: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip'
};

export const createFileHandler =
  (filePath: RestFileResponse): NativeRestDataResponseFunction =>
  ({ setHeader }) => {
    if (!isFilePathValid(filePath)) {
      throw next();
    }

    const buffer = fs.readFileSync(path.resolve(filePath));
    // ✅ important:
    // path.win32 treats both '/' and '\' — so it works both for Windows and Linux style
    const fileName = path.win32.basename(filePath);
    const fileExtension = path.win32.extname(filePath);

    const contentType = MIME_TYPES[fileExtension.toLowerCase()] ?? 'application/octet-stream';
    setHeader('Content-Type', contentType);
    setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return new Response(buffer);
  };
