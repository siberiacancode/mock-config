import type { MockServerConfig } from '@/utils/types';

import { resolveExportsFromSourceCode } from './resolveExportsFromSourceCode';

export const resolveConfigFile = async (
  configSourceCode: string,
  configDir: string
): Promise<MockServerConfig> => {
  if (!configSourceCode) {
    throw new Error('Cannot handle source code of mock-server.config.(ts|js)');
  }

  const mockServerConfigExports = await resolveExportsFromSourceCode(configSourceCode, configDir);

  const mockServerConfig: MockServerConfig = mockServerConfigExports.default;

  if (!mockServerConfig) {
    throw new Error('Cannot handle exports of mock-server.config.(ts|js)');
  }

  if (!Array.isArray(mockServerConfig)) {
    throw new TypeError(
      'configuration should be array config; see our doc (https://www.npmjs.com/package/mock-config-server) for more information'
    );
  }
  return mockServerConfig;
};
