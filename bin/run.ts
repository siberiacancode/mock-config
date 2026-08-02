import type { GraphQLMockServerConfig, RestMockServerConfig } from '@/utils/types';

import { startGraphQLMockServer, startMockServer, startRestMockServer } from '@/server';
import { isPlainObject } from '@/utils/helpers';
import { validateApiMockServerConfig, validateMockServerConfig } from '@/utils/validate';

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

      const { configs } = mergedApiMockServerConfig;
      const [firstConfig] = Array.isArray(configs) ? configs : [];

      if (isPlainObject(firstConfig) && 'path' in firstConfig) {
        validateApiMockServerConfig(mockConfig, 'rest');
        return startRestMockServer(mergedApiMockServerConfig as RestMockServerConfig);
      }

      if (
        isPlainObject(firstConfig) &&
        ('query' in firstConfig || 'operationName' in firstConfig)
      ) {
        validateApiMockServerConfig(mockConfig, 'graphql');
        return startGraphQLMockServer(mergedApiMockServerConfig as GraphQLMockServerConfig);
      }

      validateApiMockServerConfig(mockConfig, 'rest');
      return startRestMockServer(mergedApiMockServerConfig as RestMockServerConfig);
    }

    validateMockServerConfig(mockConfig);
    return startMockServer(mergedMockServerConfig);
  } catch (error: any) {
    console.error(error.message);
  }
};
