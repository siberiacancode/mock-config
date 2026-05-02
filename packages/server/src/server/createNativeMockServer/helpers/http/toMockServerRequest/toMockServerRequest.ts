import { parseCookie, parseQuery } from '@/utils/helpers';

const parseRawBody = async (body: ReadableStream<Uint8Array>, contentType: string | null) => {
  // ✅ important:
  // use 'Response' only because of convenient methods for reading stream and convert it into demanded format
  const response = new Response(body);

  if (!contentType) {
    return response.arrayBuffer();
  }

  const normalizedContentType = contentType.toLowerCase();

  if (normalizedContentType.includes('application/json')) {
    // TODO: add more realistic type than any or not?
    return await response.json();
  }

  if (normalizedContentType.includes('application/x-www-form-urlencoded')) {
    const text = await response.text();
    return Object.fromEntries(new URLSearchParams(text));
  }

  if (normalizedContentType.includes('multipart/form-data')) {
    return response.formData();
  }

  if (normalizedContentType.startsWith('text/')) {
    return response.text();
  }

  if (
    normalizedContentType.includes('application/octet-stream') ||
    normalizedContentType.startsWith('image/') ||
    normalizedContentType.startsWith('audio/') ||
    normalizedContentType.startsWith('video/')
  ) {
    return response.blob();
  }

  return response.arrayBuffer();
};

export const toMockServerRequest = async (request: Request): Promise<MockServerRequest> => {
  const rawHeaders = request.headers;
  const headers = Object.fromEntries(rawHeaders.entries());

  const cookieHeader = rawHeaders.get('cookie');
  const cookies = cookieHeader ? parseCookie(cookieHeader) : {};

  const queries = parseQuery(request.url);

  // ✅ important:
  // we can't retrieve params on this stage because we don't know url with parameters
  // so we set it as empty object for future usage
  const params = {};

  const wrap = (body: unknown, rawBody: ReadableStream<Uint8Array> | undefined) => {
    const overrides: Record<PropertyKey, unknown> = {
      body,
      cookies,
      headers,
      params,
      queries,
      rawBody,
      rawHeaders
    };
    return new Proxy(request, {
      get(target, key) {
        if (key in overrides) return overrides[key];
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      has(target, key) {
        return key in overrides || Reflect.has(target, key);
      }
    }) as unknown as MockServerRequest;
  };

  if (!request.body) {
    return wrap(undefined, undefined);
  }

  const [forParseBody, rawBody] = request.body.tee();
  const contentType = rawHeaders.get('content-type');
  const body = await parseRawBody(forParseBody, contentType);

  return wrap(body, rawBody);
};
