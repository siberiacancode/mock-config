// TODO: drop or not drop global declaration?

declare global {
  interface MockServerRequest extends Omit<Request, 'body' | 'headers'> {
    // TODO: body is our body and previos body is raw body
    // TODO: why does old body is always stream?
    body: any;
    cookies: Record<string, string>;
    headers: Record<string, string>;
    params: Record<string, string>;
    queries: Record<string, string | string[]>;
    rawBody: ReadableStream<Uint8Array> | undefined;
    rawHeaders: Headers;
  }
}

export {};
