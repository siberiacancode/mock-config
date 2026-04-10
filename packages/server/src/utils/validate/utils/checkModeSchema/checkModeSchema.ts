import { z } from 'zod';

import {
  CHECK_ACTUAL_VALUE_CHECK_MODES,
  checkModeSymbol,
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

export interface EntityDescriptorSchema {
  (
    checkModeSchema: typeof checkActualValueCheckModeSchema
  ): z.ZodObject<{ [checkModeSymbol]: typeof checkModeSchema }, 'strict'>;

  (
    checkModeSchema:
      | z.ZodLiteral<'function'>
      | z.ZodLiteral<'regExp'>
      | typeof compareWithDescriptorAnyValueCheckModeSchema
      | typeof compareWithDescriptorStringValueCheckModeSchema
      | typeof compareWithDescriptorValueCheckModeSchema,
    valueSchema: z.ZodTypeAny
  ): z.ZodObject<
    {
      [checkModeSymbol]: typeof checkModeSchema;
      value: typeof valueSchema;
    },
    'strict'
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
      [checkModeSymbol]: checkModeSchema
    });
  }
  return z.strictObject({
    [checkModeSymbol]: checkModeSchema,
    value: valueSchema
  });
}) as EntityDescriptorSchema;
