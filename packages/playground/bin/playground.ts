import type { PlaygroundServerConfig } from '@/utils/types';

import { startPlaygroundServer } from '../src';

export const playground = async (argv: PlaygroundServerConfig) => {
  try {
    const mergedPlaygroundServerConfig = {
      ...(argv.baseUrl && { baseUrl: argv.baseUrl }),
      ...(argv.port && { port: argv.port }),
      ...(argv.staticPath && { staticPath: argv.staticPath }),
      data: argv.data,
      routes: argv.routes
    } as PlaygroundServerConfig;

    return startPlaygroundServer(mergedPlaygroundServerConfig);
  } catch (error: any) {
    console.error(error.message);
  }
};
