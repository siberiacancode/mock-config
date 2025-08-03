import { z } from 'zod';

import type { PlainObject } from '@/utils/types';

import { baseUrlSchema } from './baseUrlSchema/baseUrlSchema';
import { corsSchema } from './corsSchema/corsSchema';
import { databaseConfigSchema } from './databaseConfigSchema/databaseConfigSchema';
import { getValidationMessage } from './getValidationMessage';
import { graphqlConfigSchema } from './graphqlConfigSchema/graphqlConfigSchema';
import { interceptorsSchema } from './interceptorsSchema/interceptorsSchema';
import { portSchema } from './portSchema/portSchema';
import { restConfigSchema } from './restConfigSchema/restConfigSchema';
import { staticPathSchema } from './staticPathSchema/staticPathSchema';

export const validateMockServerConfig = (mockServerConfig: PlainObject) => {
  if (
    !mockServerConfig.rest &&
    !mockServerConfig.graphql &&
    !mockServerConfig.database &&
    !mockServerConfig.staticPath
  ) {
    throw new Error(
      'Configuration should contain at least one of these configs: rest | graphql | database | staticPath; see our doc (https://github.com/siberiacancode/mock-config-server) for more information'
    );
  }

  const mockServerConfigSchema = z.strictObject({
    baseUrl: baseUrlSchema.optional(),
    port: portSchema.optional(),
    staticPath: staticPathSchema.optional(),
    interceptors: interceptorsSchema.optional(),
    cors: corsSchema.optional(),
    rest: restConfigSchema.optional(),
    graphql: graphqlConfigSchema.optional(),
    database: databaseConfigSchema.optional()
  });

  const validationResult = mockServerConfigSchema.safeParse(mockServerConfig);
  if (!validationResult.success) {
    const validationMessage = getValidationMessage(validationResult.error.issues);

    throw new Error(
      `Validation Error: configuration${validationMessage} does not match the API schema. Click here to see correct type: https://github.com/siberiacancode/mock-config-server`
    );
  }
};
