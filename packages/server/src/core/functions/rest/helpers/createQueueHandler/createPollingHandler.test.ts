import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPollingHandler } from './createPollingHandler';

const createParams = () =>
  ({
    response: {
      send: vi.fn()
    },
    setStatusCode: vi.fn(),
    next: vi.fn(() => null)
  }) as any;

describe('createPollingHandler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Should return 404 when polling is empty', async () => {
    const pollingHandler = createPollingHandler<'get'>([]);
    const params = createParams();

    const result = await pollingHandler(params);

    expect(params.next).toHaveBeenCalledTimes(1);
    expect(params.setStatusCode).not.toHaveBeenCalled();
    expect(params.response.send).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('Should cycle through polling items without time', async () => {
    const pollingHandler = createPollingHandler<'get'>([
      { data: { value: 'first' } },
      { data: { value: 'second' } }
    ]);
    const params = createParams();

    const firstResult = await pollingHandler(params);
    const secondResult = await pollingHandler(params);
    const thirdResult = await pollingHandler(params);

    expect(firstResult).toStrictEqual({ value: 'first' });
    expect(secondResult).toStrictEqual({ value: 'second' });
    expect(thirdResult).toStrictEqual({ value: 'first' });
  });

  it('Should return the same timed item until timeout elapses', async () => {
    vi.useFakeTimers();
    const pollingHandler = createPollingHandler<'get'>([
      { data: { value: 'first' }, time: 2000 },
      { data: { value: 'second' } }
    ]);
    const params = createParams();

    const firstResult = await pollingHandler(params);

    vi.advanceTimersByTime(1000);
    const secondResult = await pollingHandler(params);

    vi.advanceTimersByTime(1000);
    const thirdResult = await pollingHandler(params);

    expect(firstResult).toStrictEqual({ value: 'first' });
    expect(secondResult).toStrictEqual({ value: 'first' });
    expect(thirdResult).toStrictEqual({ value: 'second' });
  });

  it('Should not advance polling multiple times during one timeout window', async () => {
    vi.useFakeTimers();
    const pollingHandler = createPollingHandler<'get'>([
      { data: { value: 'first' }, time: 1000 },
      { data: { value: 'second' } },
      { data: { value: 'third' } }
    ]);
    const params = createParams();

    const firstResult = await pollingHandler(params);
    const secondResult = await pollingHandler(params);
    const thirdResult = await pollingHandler(params);

    vi.advanceTimersByTime(1000);
    const fourthResult = await pollingHandler(params);
    const fifthResult = await pollingHandler(params);

    expect(firstResult).toStrictEqual({ value: 'first' });
    expect(secondResult).toStrictEqual({ value: 'first' });
    expect(thirdResult).toStrictEqual({ value: 'first' });
    expect(fourthResult).toStrictEqual({ value: 'second' });
    expect(fifthResult).toStrictEqual({ value: 'third' });
  });

  it('Should call function polling item with params and return its result', async () => {
    const pollingItemHandler = vi.fn().mockReturnValue({ value: 'handler' });
    const pollingHandler = createPollingHandler<'get'>([
      {
        data: pollingItemHandler
      }
    ]);
    const params = createParams();

    const result = await pollingHandler(params);

    expect(pollingItemHandler).toHaveBeenCalledWith(params);
    expect(pollingItemHandler).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual({ value: 'handler' });
  });

  it('Should support generator-based pollings', async () => {
    const pollingHandler = createPollingHandler<'get'>(function* (params) {
      expect(params).toBeDefined();
      yield { value: 'first' };
      return { value: 'second' };
    });
    const params = createParams();

    const firstResult = await pollingHandler(params);
    const secondResult = await pollingHandler(params);
    const thirdResult = await pollingHandler(params);

    expect(firstResult).toStrictEqual({ value: 'first' });
    expect(secondResult).toStrictEqual({ value: 'second' });
    expect(thirdResult).toStrictEqual({ value: 'first' });
  });
});
