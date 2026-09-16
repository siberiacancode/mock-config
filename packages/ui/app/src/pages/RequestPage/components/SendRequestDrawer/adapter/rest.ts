import type { EntityRow, RequestPayload } from '../types';

import { joinPath, toCookieHeader, toRecord } from '../helpers';

interface BuildRequestPayloadOptions {
  body?: string;
  componentBaseUrl?: string;
  entityRows: Record<string, EntityRow[]>;
  method: string;
  path: string;
}

export const buildRestPayload = (options: BuildRequestPayloadOptions): RequestPayload => {
  const requestPath = Object.entries(toRecord(options.entityRows.params)).reduce(
    (accumulator, [name, value]) => accumulator.replaceAll(`:${name}`, encodeURIComponent(value)),
    options.path
  );
  const search = new URLSearchParams(toRecord(options.entityRows.queries)).toString();
  const cookie = toCookieHeader(options.entityRows.cookies);

  return {
    method: options.method,
    path: `${joinPath(options.componentBaseUrl, requestPath)}${search ? `?${search}` : ''}`,
    headers: {
      ...(options.body && { 'Content-Type': 'application/json' }),
      ...toRecord(options.entityRows.headers),
      ...(cookie && { Cookie: cookie })
    },
    ...(options.body && { body: options.body })
  };
};
