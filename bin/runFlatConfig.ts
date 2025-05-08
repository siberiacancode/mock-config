#!/usr/bin/env node

import { getPort } from 'get-port-please';

import { startFlatMockServer } from '@/server';

import type { FlatMockServerConfig, MockServerConfigArgv } from '../src';

export const runFlatConfig = async (
  flatMockServerConfig: FlatMockServerConfig,
  { baseUrl, staticPath, ...options }: MockServerConfigArgv
) => {
  try {
    const [option, ...flatMockServerComponents] = flatMockServerConfig;
    const flatMockServerSettings = !('configs' in option) ? option : undefined;

    const host = '127.0.0.1';
    const port = flatMockServerSettings?.port || options.port;

    const mergedFlatMockServerConfig = [
      {
        ...flatMockServerSettings,
        ...(baseUrl && { baseUrl }),
        ...(port && { port }),
        ...(!port && { port: await getPort({ port, portRange: [7777, 9000], host }) }),
        ...(staticPath && { staticPath })
      },
      ...(flatMockServerSettings ? flatMockServerComponents : flatMockServerConfig)
    ] as FlatMockServerConfig;

    return startFlatMockServer(mergedFlatMockServerConfig);
  } catch (error: any) {
    console.error(error.message);
  }
};
