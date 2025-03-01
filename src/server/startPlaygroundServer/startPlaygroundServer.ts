import color from 'ansi-colors';

import type { DatabaseMockServerConfig } from '@/utils/types';

import { destroyerMiddleware } from '@/core/middlewares';
import { DEFAULT } from '@/utils/constants';

import { createPlaygroundServer } from '../createPlaygroundServer/createPlaygroundServer';

export const startPlaygroundServer = (databaseMockServerConfig: DatabaseMockServerConfig) => {
  const mockServer = createPlaygroundServer(databaseMockServerConfig);
  const port = databaseMockServerConfig.port ?? DEFAULT.PORT;

  const server = mockServer.listen(port, () => {
    console.info(color.green(`🎉 Playground server is running at http://localhost:${port}`));
  });

  // ✅ important: add destroy method for closing keep-alive connections after server shutdown
  return destroyerMiddleware(server);
};
