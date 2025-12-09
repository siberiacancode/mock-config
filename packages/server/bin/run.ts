#!/usr/bin/env node

import type { GraphQLMockServerConfig, RestMockServerConfig } from '@/utils/types';

import { startGraphQLMockServer, startMockServer, startRestMockServer } from '@/server';
import { isPlainObject } from '@/utils/helpers';

import type { MockServerConfig, MockServerConfigArgv } from '../src';

export const run = (
  mockConfig: MockServerConfig,
  { baseUrl, port, staticPath }: MockServerConfigArgv
) => {
  console.warn(
    `**DEPRECATION WARNING**\nThe old mock config format is deprecated and will be removed in the next major version. Please use new format of config (flat config); see our doc (https://github.com/siberiacancode/mock-config-server) for more information`
  );

  try {
    const mergedMockServerConfig = {
      ...mockConfig,
      ...(baseUrl && { baseUrl }),
      ...(port && { port }),
      ...(staticPath && { staticPath })
    } as MockServerConfig;

    if (
      !mergedMockServerConfig.rest &&
      !mergedMockServerConfig.graphql &&
      'configs' in mergedMockServerConfig
    ) {
      const mergedApiMockServerConfig = mergedMockServerConfig as
        | GraphQLMockServerConfig
        | RestMockServerConfig;

      if (
        Array.isArray(mergedApiMockServerConfig.configs) &&
        isPlainObject(mergedApiMockServerConfig.configs[0]) &&
        'path' in mergedApiMockServerConfig.configs[0]
      ) {
        return startRestMockServer(mergedApiMockServerConfig as RestMockServerConfig);
      }

      if (
        Array.isArray(mergedApiMockServerConfig.configs) &&
        isPlainObject(mergedApiMockServerConfig.configs[0]) &&
        ('query' in mergedApiMockServerConfig.configs[0] ||
          'operationName' in mergedApiMockServerConfig.configs[0])
      ) {
        return startGraphQLMockServer(mergedApiMockServerConfig as GraphQLMockServerConfig);
      }

      return startRestMockServer(mergedApiMockServerConfig as RestMockServerConfig);
    }

    return startMockServer(mergedMockServerConfig);
  } catch (error: any) {
    console.error(error.message);
  }
};
