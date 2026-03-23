#!/usr/bin/env node

import { startMockServer } from '@/server';

import type { MockServerCliArgv, MockServerConfig } from '../src';

export const run = (
  mockServerConfig: MockServerConfig,
  { baseUrl, port, staticPath }: MockServerCliArgv
) => {
  try {
    const [option, ...mockServerComponents] = mockServerConfig;
    const mockServerSettings = !('configs' in option) ? option : undefined;

    const mergedMockServerConfig = [
      {
        ...mockServerSettings,
        ...(baseUrl && { baseUrl }),
        ...(port && { port }),
        ...(staticPath && { staticPath })
      },
      ...(mockServerSettings ? mockServerComponents : mockServerConfig)
    ] as MockServerConfig;

    return startMockServer(mergedMockServerConfig);
  } catch (error: any) {
    console.error(error.message);
  }
};
