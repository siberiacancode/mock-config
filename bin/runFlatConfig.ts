import { startFlatMockServer } from '@/server';
import { validateFlatMockServerConfig } from '@/utils/validate';

import type { FlatMockServerConfig, MockServerConfigArgv } from '../src';

export const runFlatConfig = (
  flatMockServerConfig: FlatMockServerConfig,
  { baseUrl, port, staticPath }: MockServerConfigArgv
) => {
  try {
    validateFlatMockServerConfig(flatMockServerConfig);
    const [option, ...flatMockServerComponents] = flatMockServerConfig;
    const flatMockServerSettings = !('configs' in option) ? option : undefined;

    const mergedFlatMockServerConfig = [
      {
        ...flatMockServerSettings,
        ...(baseUrl && { baseUrl }),
        ...(port && { port }),
        ...(staticPath && { staticPath })
      },
      ...(flatMockServerSettings ? flatMockServerComponents : flatMockServerConfig)
    ] as FlatMockServerConfig;

    return startFlatMockServer(mergedFlatMockServerConfig);
  } catch (error: any) {
    console.error(error.message);
  }
};
