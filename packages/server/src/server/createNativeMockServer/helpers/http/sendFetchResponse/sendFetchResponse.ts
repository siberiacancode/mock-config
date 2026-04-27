import type { ServerResponse } from 'node:http';

// TODO check streams and cookie handling

export const sendFetchResponse = (serverResponse: ServerResponse, fetchResponse: Response) => {
  serverResponse.statusCode = fetchResponse.status;
  serverResponse.setHeaders(fetchResponse.headers);

  serverResponse.write(fetchResponse.arrayBuffer());
  serverResponse.end();
};
