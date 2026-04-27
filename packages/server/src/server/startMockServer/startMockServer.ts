import color from 'ansi-colors';

import type { MockServerConfig } from '@/utils/types';

import { destroyerMiddleware } from '@/core/middlewares';
import { DEFAULT } from '@/utils/constants';

import { createNativeMockServer } from '../createNativeMockServer/createNativeMockServer';

export const startMockServer = (mockServerConfig: MockServerConfig) => {
  const mockServer = createNativeMockServer(mockServerConfig);

  const [option] = mockServerConfig;
  const mockServerSettings = !('configs' in option) ? option : {};
  const { port = DEFAULT.PORT } = mockServerSettings;

  const server = mockServer.listen(port, () => {
    console.log(color.green(`🎉 Mock Server is running at http://localhost:${port}`));
  });

  // ✅ important: add destroy method for closing keep-alive connections after server shutdown
  return destroyerMiddleware(server);
};
