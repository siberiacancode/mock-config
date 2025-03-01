import { startPlaygroundServer } from 'src';

import type { DatabaseMockServerConfig, MockServerConfigPlaygroundArgv } from '@/utils/types';

export const playground = async (argv: MockServerConfigPlaygroundArgv) => {
  try {
    const mergedPlaygroundServerConfig = {
      ...(argv.baseUrl && { baseUrl: argv.baseUrl }),
      ...(argv.port && { port: argv.port }),
      data: argv.data
    } as DatabaseMockServerConfig;

    return startPlaygroundServer(mergedPlaygroundServerConfig);
  } catch (error: any) {
    console.error(error.message);
  }
};
