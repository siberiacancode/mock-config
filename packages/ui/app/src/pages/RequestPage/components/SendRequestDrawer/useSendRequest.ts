import { useState } from 'react';

import type { RequestPayload, SendResult } from './types';

export const useSendRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SendResult | undefined>(undefined);

  const send = async (payload: RequestPayload) => {
    setIsLoading(true);
    setResult(undefined);

    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setResult('error' in data ? { error: String(data.error) } : { response: data });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Request failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, result, send };
};
