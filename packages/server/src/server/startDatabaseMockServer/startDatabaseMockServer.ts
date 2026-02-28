import color from 'ansi-colors';

import type { DatabaseMockServerConfig } from '@/utils/types';

import { destroyerMiddleware } from '@/core/middlewares';
import { DEFAULT } from '@/utils/constants';

import { createDatabaseMockServer } from '../createDatabaseMockServer/createDatabaseMockServer';

export const startDatabaseMockServer = (databaseMockServerConfig: DatabaseMockServerConfig) => {
  const mockServer = createDatabaseMockServer(databaseMockServerConfig);
  const port = databaseMockServerConfig.port ?? DEFAULT.PORT;

  const server = mockServer.listen(port, () => {
    console.info(color.green(`🎉 Database Mock Server is running at http://localhost:${port}`));
  });

  // ✅ important: add destroy method for closing keep-alive connections after server shutdown
  return destroyerMiddleware(server);
};
