// TODO: drop or not drop global declaration?

declare global {
  interface MockServerRequest<
    Query = Record<string, string | string[]>,
    Body = any,
    Params = Record<string, string>
  > extends Omit<Request, 'body' | 'headers'> {
    // TODO: body is our body and previos body is raw body
    // TODO: why does old body is always stream?
    body: Body;
    cookies: Record<string, string>;
    headers: Record<string, string>;
    params: Params;
    queries: Query;
    rawBody: ReadableStream<Uint8Array> | undefined;
    rawHeaders: Headers;
  }
}

export {};
