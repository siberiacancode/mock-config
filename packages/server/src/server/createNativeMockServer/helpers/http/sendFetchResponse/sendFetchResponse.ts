import type { ServerResponse } from 'node:http';

import { Buffer } from 'node:buffer';

// TODO check streams and cookie handling

export const sendFetchResponse = async (
  serverResponse: ServerResponse,
  fetchResponse: Response
) => {
  serverResponse.statusCode = fetchResponse.status;
  serverResponse.setHeaders(fetchResponse.headers);

  serverResponse.write(Buffer.from(await fetchResponse.arrayBuffer()));
  serverResponse.end();
};
