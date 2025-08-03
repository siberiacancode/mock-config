import { z } from 'zod';

import type { PlainObject } from '@/utils/types';

import { baseUrlSchema } from './baseUrlSchema/baseUrlSchema';
import { corsSchema } from './corsSchema/corsSchema';
import { databaseConfigSchema } from './databaseConfigSchema/databaseConfigSchema';
import { getValidationMessage } from './getValidationMessage';
import { graphqlRequestConfigSchema } from './graphqlConfigSchema/graphqlConfigSchema';
// import { graphqlRequestConfigSchema } from './graphqlConfigSchema/graphqlConfigSchema';
import { interceptorsSchema } from './interceptorsSchema/interceptorsSchema';
import { portSchema } from './portSchema/portSchema';
import { restRequestConfigSchema } from './restConfigSchema/restConfigSchema';
import { staticPathSchema } from './staticPathSchema/staticPathSchema';

export const validateFlatMockServerConfig = (flatMockServerConfig: PlainObject) => {
  if (!flatMockServerConfig.length) {
    throw new Error(
      'Flat config should contain at least one element; see our doc (https://github.com/siberiacancode/mock-config-server) for more information'
    );
  }

  const flatMockServerSettingsSchema = z.strictObject({
    baseUrl: baseUrlSchema.optional(),
    port: portSchema.optional(),
    staticPath: staticPathSchema.optional(),
    interceptors: interceptorsSchema.optional(),
    cors: corsSchema.optional(),
    database: databaseConfigSchema.optional()
  });

  const flatMockServerComponentSchema = z.strictObject({
    name: z.string().optional(),
    baseUrl: baseUrlSchema.optional(),
    interceptors: interceptorsSchema.optional(),
    configs: z.array(z.union([restRequestConfigSchema, graphqlRequestConfigSchema]))
  });

  const flatMockServerConfigSchema = z.tuple(
    [z.union([flatMockServerSettingsSchema, flatMockServerComponentSchema])],
    flatMockServerComponentSchema
  );

  const validationFlatMockServerConfigSchemaResult =
    flatMockServerConfigSchema.safeParse(flatMockServerConfig);

  if (!validationFlatMockServerConfigSchemaResult.success) {
    console.log('ee');

    const validationMessage = getValidationMessage(
      validationFlatMockServerConfigSchemaResult.error.issues
    );

    throw new Error(
      `Validation Error: configuration${validationMessage} does not match the API schema. Click here to see correct type: https://github.com/siberiacancode/mock-config-server`
    );
  }
};
