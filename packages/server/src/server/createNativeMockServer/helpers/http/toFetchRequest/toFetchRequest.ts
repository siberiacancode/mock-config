import type { IncomingMessage } from 'node:http';

import { Readable } from 'node:stream';

const getRequestURL = (incomingMessage: IncomingMessage): URL => {
  // ✅ important:
  // we don't check 'https' protocol because currently we support only 'http.createServer' server creation
  // 'http.createServer' will never handle encrypted incoming message because of lack of important parts for https server:
  // i.e. TLS handshake handing, cert providing, encryption
  const incomingMessageProtocol = 'http';
  // ✅ important:
  // we accept a risk of lack of host header because without it there is no sense in futher code
  const incomingMessageHost = incomingMessage.headers.host!;
  const incomingMessageUrl = incomingMessage.url!;

  return new URL(incomingMessageUrl, `${incomingMessageProtocol}://${incomingMessageHost}`);
};

export const toFetchRequest = (incomingMessage: IncomingMessage): Request => {
  const requestURL = getRequestURL(incomingMessage);

  const requestInit: RequestInit & { duplex?: 'half' } = {
    method: incomingMessage.method,
    // ✅ important:
    // the only one header that can have string[] typed value is 'Set-Cookie'
    // this header is exception in RFC. Because we're a server we don't handle this header
    // so we can narrow our type
    headers: incomingMessage.headers as Record<string, string>
  };

  // ✅ important:
  // Request constructor throws an error when we try to set body for GET or HEAD
  if (requestInit.method !== 'GET' && requestInit.method !== 'HEAD') {
    requestInit.body = Readable.toWeb(incomingMessage) as ReadableStream<Uint8Array>;
    // ✅ important:
    // fetch API was created specifically for browsers
    // browsers demand ordered request-response interaction
    // so in Node.JS we do the same via setting 'half'.
    // Duplex is required for stream because there is no information about streamed data
    // TODO: learn more about it
    requestInit.duplex = 'half';
  }

  const request = new Request(requestURL, requestInit);

  return request;
};
