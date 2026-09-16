import { useEffect, useRef, useState } from 'react';

import type { RequestPayload, SendResult } from '../../types';

import { getResponseReader } from '../../adapter';

export const useSendRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SendResult | undefined>(undefined);
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (payload: RequestPayload) => {
    setIsLoading(true);
    setResult(undefined);

    const controller = new AbortController();
    abortRef.current = controller;
    const startedAt = performance.now();

    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      await getResponseReader(response).read(response, setResult, startedAt);
    } catch (error) {
      if (controller.signal.aborted) return;
      setResult({ error: error instanceof Error ? error.message : 'Request failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const stop = () => abortRef.current?.abort();

  return { isLoading, result, send, stop };
};
