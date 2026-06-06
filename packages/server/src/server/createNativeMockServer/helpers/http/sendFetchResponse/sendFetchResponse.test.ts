import type { ServerResponse } from 'node:http';

import { describe, expect, it, vi } from 'vitest';

import { sendFetchResponse } from './sendFetchResponse';

const textEncoder = new TextEncoder();

const createServerResponse = () =>
  ({
    end: vi.fn(),
    flushHeaders: vi.fn(),
    setHeaders: vi.fn(),
    statusCode: 0,
    write: vi.fn(() => true)
  }) as unknown as ServerResponse;

describe('sendFetchResponse', () => {
  it('Should write response body chunks without waiting for stream end', async () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const fetchResponse = new Response(
      new ReadableStream<Uint8Array>({
        start: (streamController) => {
          controller = streamController;
        }
      }),
      { status: 201 }
    );
    const serverResponse = createServerResponse();

    const sendPromise = sendFetchResponse(serverResponse, fetchResponse);

    controller.enqueue(textEncoder.encode('first'));

    await vi.waitFor(() => {
      expect(serverResponse.write).toHaveBeenCalledTimes(1);
    });
    expect(serverResponse.write).toHaveBeenNthCalledWith(1, textEncoder.encode('first'));
    expect(serverResponse.end).not.toHaveBeenCalled();

    controller.enqueue(textEncoder.encode('second'));

    await vi.waitFor(() => {
      expect(serverResponse.write).toHaveBeenCalledTimes(2);
    });
    expect(serverResponse.write).toHaveBeenNthCalledWith(2, textEncoder.encode('second'));

    controller.close();
    await sendPromise;

    expect(serverResponse.statusCode).toBe(201);
    expect(serverResponse.flushHeaders).toHaveBeenCalledTimes(1);
    expect(serverResponse.end).toHaveBeenCalledTimes(1);
  });

  it('Should end response when fetch response has no body', async () => {
    const fetchResponse = new Response(null, { status: 204 });
    const serverResponse = createServerResponse();

    await sendFetchResponse(serverResponse, fetchResponse);

    expect(serverResponse.statusCode).toBe(204);
    expect(serverResponse.flushHeaders).not.toHaveBeenCalled();
    expect(serverResponse.write).not.toHaveBeenCalled();
    expect(serverResponse.end).toHaveBeenCalledTimes(1);
  });
});
