import { z } from 'zod';

import type { PlainObject } from '@/utils/types';

import { baseUrlSchema } from './baseUrlSchema/baseUrlSchema';
import { corsSchema } from './corsSchema/corsSchema';
import { getMostSpecificPathFromError } from './getMostSpecificPathFromError';
import { getValidationMessageFromPath } from './getValidationMessageFromPath';
import { graphqlRequestConfigSchema } from './graphqlConfigSchema/graphqlConfigSchema';
import { interceptorsSchema } from './interceptorsSchema/interceptorsSchema';
import { playgroundConfigSchema } from './playgroundConfigSchema/playgroundConfigSchema';
import { portSchema } from './portSchema/portSchema';
import { restRequestConfigSchema } from './restConfigSchema/restConfigSchema';
import { staticPathSchema } from './staticPathSchema/staticPathSchema';
import { plainObjectSchema } from './utils';

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
    interceptors: plainObjectSchema(interceptorsSchema).optional(),
    cors: corsSchema.optional(),
    database: playgroundConfigSchema.optional()
  });

  const flatMockServerComponentSchema = z.strictObject({
    name: z.string().optional(),
    baseUrl: baseUrlSchema.optional(),
    interceptors: plainObjectSchema(interceptorsSchema).optional(),
    configs: z.array(z.union([restRequestConfigSchema, graphqlRequestConfigSchema]))
  });

  const flatMockServerConfigSchema = z
    .tuple([plainObjectSchema(flatMockServerSettingsSchema).or(flatMockServerComponentSchema)])
    .rest(flatMockServerComponentSchema);

  const validationFlatMockServerConfigSchemaResult =
    flatMockServerConfigSchema.safeParse(flatMockServerConfig);

  if (!validationFlatMockServerConfigSchemaResult.success) {
    const path = getMostSpecificPathFromError(validationFlatMockServerConfigSchemaResult.error);
    const validationMessage = getValidationMessageFromPath(path);

    throw new Error(
      `Validation Error: configuration${validationMessage} does not match the API schema. Click here to see correct type: https://github.com/siberiacancode/mock-config-server`
    );
  }
};
