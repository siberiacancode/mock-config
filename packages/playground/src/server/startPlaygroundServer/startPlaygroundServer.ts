import color from 'ansi-colors';

import type { PlaygroundServerConfig } from '@/utils/types';

import { destroyerMiddleware } from '@/shared/middlewares';
import { DEFAULT } from '@/shared/constants';

import { createPlaygroundServer } from '../createPlaygroundServer/createPlaygroundServer';

export const startPlaygroundServer = (playgroundServerConfig: PlaygroundServerConfig) => {
  const playgroundServer = createPlaygroundServer(playgroundServerConfig);
  const port = playgroundServerConfig.port ?? DEFAULT.PORT;

  const server = playgroundServer.listen(port, () => {
    console.info(color.green(`🎉 Playground server is running at http://localhost:${port}`));
  });

  return destroyerMiddleware(server);
};
