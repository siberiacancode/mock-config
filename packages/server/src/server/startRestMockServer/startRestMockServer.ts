import color from 'ansi-colors';

import type { RestMockServerConfig } from '@/utils/types';

import { destroyerMiddleware } from '@/core/middlewares';
import { DEFAULT } from '@/utils/constants';

import { createRestMockServer } from '../createRestMockServer/createRestMockServer';

export const startRestMockServer = (restMockServerConfig: RestMockServerConfig) => {
  const mockServer = createRestMockServer(restMockServerConfig);
  const port = restMockServerConfig.port ?? DEFAULT.PORT;

  const server = mockServer.listen(port, () => {
    console.info(color.green(`🎉 Rest Mock Server is running at http://localhost:${port}`));
  });

  // ✅ important: add destroy method for closing keep-alive connections after server shutdown
  return destroyerMiddleware(server);
};
