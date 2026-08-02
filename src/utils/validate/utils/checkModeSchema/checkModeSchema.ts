import { z } from 'zod';

import {
  CHECK_ACTUAL_VALUE_CHECK_MODES,
  COMPARE_WITH_DESCRIPTOR_ANY_VALUE_CHECK_MODES,
  COMPARE_WITH_DESCRIPTOR_STRING_VALUE_CHECK_MODES,
  COMPARE_WITH_DESCRIPTOR_VALUE_CHECK_MODES
} from '@/utils/constants';

export const checkActualValueCheckModeSchema = z.enum(CHECK_ACTUAL_VALUE_CHECK_MODES);

export const compareWithDescriptorAnyValueCheckModeSchema = z.enum(
  COMPARE_WITH_DESCRIPTOR_ANY_VALUE_CHECK_MODES
);

export const compareWithDescriptorStringValueCheckModeSchema = z.enum(
  COMPARE_WITH_DESCRIPTOR_STRING_VALUE_CHECK_MODES
);

export const compareWithDescriptorValueCheckModeSchema = z.enum(
  COMPARE_WITH_DESCRIPTOR_VALUE_CHECK_MODES
);

// TODO why this fn in that file?
export interface EntityDescriptorSchema {
  (
    checkModeSchema: typeof checkActualValueCheckModeSchema
  ): z.ZodObject<{ checkMode: typeof checkModeSchema }, z.core.$strict>;

  (
    checkModeSchema:
      | z.ZodLiteral<'function'>
      | z.ZodLiteral<'regExp'>
      | typeof compareWithDescriptorAnyValueCheckModeSchema
      | typeof compareWithDescriptorStringValueCheckModeSchema
      | typeof compareWithDescriptorValueCheckModeSchema,
    valueSchema: z.ZodTypeAny
  ): z.ZodDiscriminatedUnion<
    [
      z.ZodObject<
        {
          checkMode: typeof checkModeSchema;
          oneOf: z.ZodLiteral<true>;
          value: z.ZodArray<typeof valueSchema>;
        },
        z.core.$strict
      >,
      z.ZodObject<
        {
          checkMode: typeof checkModeSchema;
          oneOf: z.ZodOptional<z.ZodLiteral<false>>;
          value: typeof valueSchema;
        },
        z.core.$strict
      >
    ],
    'oneOf'
  >;
}

export const entityDescriptorSchema = ((
  checkModeSchema:
    | z.ZodLiteral<'function'>
    | z.ZodLiteral<'regExp'>
    | typeof checkActualValueCheckModeSchema
    | typeof compareWithDescriptorAnyValueCheckModeSchema
    | typeof compareWithDescriptorStringValueCheckModeSchema
    | typeof compareWithDescriptorValueCheckModeSchema,
  valueSchema?: z.ZodTypeAny
) => {
  const isCheckActualValueCheckMode = !valueSchema;
  if (isCheckActualValueCheckMode) {
    return z.strictObject({
      checkMode: checkModeSchema
    });
  }

  return z.discriminatedUnion('oneOf', [
    z.strictObject({
      checkMode: checkModeSchema,
      value: valueSchema,
      oneOf: z.literal(false).optional()
    }),
    z.strictObject({
      checkMode: checkModeSchema,
      value: z.array(valueSchema),
      oneOf: z.literal(true)
    })
  ]);
}) as EntityDescriptorSchema;
