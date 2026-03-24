import { z } from 'zod';

import type { PlainObject } from '@/utils/types';

import { baseUrlSchema } from './baseUrlSchema/baseUrlSchema';
import { corsSchema } from './corsSchema/corsSchema';
import { databaseConfigSchema } from './databaseConfigSchema/databaseConfigSchema';
import { getMostSpecificPathFromError } from './getMostSpecificPathFromError';
import { getValidationMessageFromPath } from './getValidationMessageFromPath';
import { graphqlRequestConfigSchema } from './graphqlConfigSchema/graphqlConfigSchema';
import { interceptorsSchema } from './interceptorsSchema/interceptorsSchema';
import { portSchema } from './portSchema/portSchema';
import { restRequestConfigSchema } from './restConfigSchema/restConfigSchema';
import { staticPathSchema } from './staticPathSchema/staticPathSchema';
import { plainObjectSchema } from './utils';
import { websocketRequestConfigSchema } from './websocketConfigSchema/websocketConfigSchema';

export const validateMockServerConfig = (mockServerConfig: PlainObject) => {
  if (!mockServerConfig.length) {
    throw new Error(
      'Config should contain at least one element; see our doc (https://github.com/siberiacancode/mock-config-server) for more information'
    );
  }

  const mockServerSettingsSchema = z.strictObject({
    baseUrl: baseUrlSchema.optional(),
    port: portSchema.optional(),
    staticPath: staticPathSchema.optional(),
    interceptors: plainObjectSchema(interceptorsSchema).optional(),
    cors: corsSchema.optional(),
    database: databaseConfigSchema.optional()
  });

  const mockServerComponentSchema = z.strictObject({
    name: z.string().optional(),
    baseUrl: baseUrlSchema.optional(),
    interceptors: plainObjectSchema(interceptorsSchema).optional(),
    configs: z.array(
      z.union([restRequestConfigSchema, graphqlRequestConfigSchema, websocketRequestConfigSchema])
    )
  });

  const mockServerConfigSchema = z
    .tuple([plainObjectSchema(mockServerSettingsSchema).or(mockServerComponentSchema)])
    .rest(mockServerComponentSchema);

  const validationMockServerConfigSchemaResult = mockServerConfigSchema.safeParse(mockServerConfig);

  if (!validationMockServerConfigSchemaResult.success) {
    const path = getMostSpecificPathFromError(validationMockServerConfigSchemaResult.error);
    const validationMessage = getValidationMessageFromPath(path);

    throw new Error(
      `Validation Error: configuration${validationMessage} does not match the API schema. Click here to see correct type: https://github.com/siberiacancode/mock-config-server`
    );
  }
};
