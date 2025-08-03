import { z } from 'zod';

import type { PlainObject } from '@/utils/types';

import { baseUrlSchema } from './baseUrlSchema/baseUrlSchema';
import { corsSchema } from './corsSchema/corsSchema';
import { databaseConfigSchema } from './databaseConfigSchema/databaseConfigSchema';
import { getMostSpecificPathFromError } from './getMostSpecificPathFromError';
import { getValidationMessageFromPath } from './getValidationMessageFromPath';
import { graphqlConfigSchema } from './graphqlConfigSchema/graphqlConfigSchema';
import { interceptorsSchema } from './interceptorsSchema/interceptorsSchema';
import { portSchema } from './portSchema/portSchema';
import { restConfigSchema } from './restConfigSchema/restConfigSchema';
import { staticPathSchema } from './staticPathSchema/staticPathSchema';

export const validateApiMockServerConfig = (
  mockServerConfig: PlainObject,
  api: 'graphql' | 'rest'
) => {
  if (!mockServerConfig.configs && !mockServerConfig.database && !mockServerConfig.staticPath) {
    throw new Error(
      'Configuration should contain at least one of these configs: configs | database | staticPath; see our doc (https://github.com/siberiacancode/mock-config-server) for more information'
    );
  }

  const mockServerConfigSchema = z.strictObject({
    baseUrl: baseUrlSchema.optional(),
    port: portSchema.optional(),
    staticPath: staticPathSchema.optional(),
    interceptors: interceptorsSchema.optional(),
    cors: corsSchema.optional(),
    database: databaseConfigSchema.optional(),
    ...(api === 'graphql' && { configs: graphqlConfigSchema.shape.configs.optional() }),
    ...(api === 'rest' && { configs: restConfigSchema.shape.configs.optional() })
  });

  const validationResult = mockServerConfigSchema.safeParse(mockServerConfig);
  if (!validationResult.success) {
    const path = getMostSpecificPathFromError(validationResult.error.issues);
    const validationMessage = getValidationMessageFromPath(path);

    throw new Error(
      `Validation Error: configuration${validationMessage} does not match the API schema. Click here to see correct type: https://github.com/siberiacancode/mock-config-server`
    );
  }
};
