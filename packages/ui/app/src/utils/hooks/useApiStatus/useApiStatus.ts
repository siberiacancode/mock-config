import { useInterval, useMount } from '@siberiacancode/reactuse';
import { useState } from 'react';

const API_STATUS_POLL_INTERVAL = 5000;

export type ServerStatus = 'down' | 'up';

export const useApiStatus = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('down');

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const status = (await response.json()) as ApiStatus;
      setServerStatus(status.mockServer ? 'up' : 'down');
    } catch {
      setServerStatus('down');
    }
  };

  useMount(() => {
    checkStatus();
  });
  useInterval(checkStatus, API_STATUS_POLL_INTERVAL);

  return { serverStatus };
};
