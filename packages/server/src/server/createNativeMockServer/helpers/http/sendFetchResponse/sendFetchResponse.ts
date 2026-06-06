import type { ServerResponse } from 'node:http';

import { once } from 'node:events';

export const sendFetchResponse = async (
  serverResponse: ServerResponse,
  fetchResponse: Response
) => {
  serverResponse.statusCode = fetchResponse.status;
  serverResponse.setHeaders(fetchResponse.headers);

  if (!fetchResponse.body) {
    serverResponse.end();
    return;
  }

  serverResponse.flushHeaders();

  const reader = fetchResponse.body.getReader();

  // what about BYOB reader?
  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // ✅ important:
      // Handle end-to-end backpressure
      const isBufferWritable = serverResponse.write(value);
      if (!isBufferWritable) {
        await once(serverResponse, 'drain');
      }
    }
  } finally {
    reader.releaseLock();
  }

  serverResponse.end();
};
