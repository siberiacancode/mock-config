import { afterEach, describe, expect, it, vi } from 'vitest';

import { createQueueHandler } from './createQueueHandler';

const createParams = () =>
  ({
    response: {
      send: vi.fn()
    },
    setStatusCode: vi.fn(),
    next: vi.fn(() => null)
  }) as any;

describe('createQueueHandler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Should return 404 when queue is empty', async () => {
    const queueHandler = createQueueHandler([]);
    const params = createParams();

    const result = await queueHandler(params);

    expect(params.next).toHaveBeenCalledTimes(1);
    expect(params.setStatusCode).not.toHaveBeenCalled();
    expect(params.response.send).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('Should cycle through queue items without time', async () => {
    const queueHandler = createQueueHandler([
      { data: { data: { value: 'first' } } },
      { data: { data: { value: 'second' } } }
    ]);
    const params = createParams();

    const firstResult = await queueHandler(params);
    const secondResult = await queueHandler(params);
    const thirdResult = await queueHandler(params);

    expect(firstResult).toStrictEqual({ data: { value: 'first' } });
    expect(secondResult).toStrictEqual({ data: { value: 'second' } });
    expect(thirdResult).toStrictEqual({ data: { value: 'first' } });
  });

  it('Should return the same timed item until timeout elapses', async () => {
    vi.useFakeTimers();
    const queueHandler = createQueueHandler([
      { data: { data: { value: 'first' } }, time: 2000 },
      { data: { data: { value: 'second' } } }
    ]);
    const params = createParams();

    const firstResult = await queueHandler(params);

    vi.advanceTimersByTime(1000);
    const secondResult = await queueHandler(params);

    vi.advanceTimersByTime(1000);
    const thirdResult = await queueHandler(params);

    expect(firstResult).toStrictEqual({ data: { value: 'first' } });
    expect(secondResult).toStrictEqual({ data: { value: 'first' } });
    expect(thirdResult).toStrictEqual({ data: { value: 'second' } });
  });

  it('Should not advance queue multiple times during one timeout window', async () => {
    vi.useFakeTimers();
    const queueHandler = createQueueHandler([
      { data: { data: { value: 'first' } }, time: 1000 },
      { data: { data: { value: 'second' } } },
      { data: { data: { value: 'third' } } }
    ]);
    const params = createParams();

    const firstResult = await queueHandler(params);
    const secondResult = await queueHandler(params);
    const thirdResult = await queueHandler(params);

    vi.advanceTimersByTime(1000);
    const fourthResult = await queueHandler(params);
    const fifthResult = await queueHandler(params);

    expect(firstResult).toStrictEqual({ data: { value: 'first' } });
    expect(secondResult).toStrictEqual({ data: { value: 'first' } });
    expect(thirdResult).toStrictEqual({ data: { value: 'first' } });
    expect(fourthResult).toStrictEqual({ data: { value: 'second' } });
    expect(fifthResult).toStrictEqual({ data: { value: 'third' } });
  });

  it('Should call function queue item with params and return its result', async () => {
    const queueItemHandler = vi.fn().mockReturnValue({ value: 'handler' });
    const queueHandler = createQueueHandler([
      {
        data: queueItemHandler
      }
    ]);
    const params = createParams();

    const result = await queueHandler(params);

    expect(queueItemHandler).toHaveBeenCalledWith(params);
    expect(queueItemHandler).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({ value: 'handler' });
  });
});
