import color from 'ansi-colors';

import type { FlatMockServerConfig } from '@/utils/types';

import { destroyerMiddleware } from '@/core/middlewares';
import { DEFAULT } from '@/utils/constants';

import { createFlatMockServer } from '../createFlatMockServer/createFlatMockServer';

export const startFlatMockServer = (flatMockServerConfig: FlatMockServerConfig) => {
  const flatMockServer = createFlatMockServer(flatMockServerConfig);

  const [option] = flatMockServerConfig;
  const flatMockServerSettings = !('configs' in option) ? option : {};
  const { port = DEFAULT.PORT } = flatMockServerSettings;

  const server = flatMockServer.listen(port, () => {
    console.log(color.green(`🎉 Flat Mock Server is running at http://localhost:${port}`));
  });

  // ✅ important: add destroy method for closing keep-alive connections after server shutdown
  return destroyerMiddleware(server);
};
