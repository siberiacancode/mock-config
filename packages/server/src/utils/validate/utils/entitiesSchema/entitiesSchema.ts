import { z } from 'zod';

import { isPlainObject } from '@/utils/helpers';

import {
  checkActualValueCheckModeSchema,
  compareWithDescriptorAnyValueCheckModeSchema,
  compareWithDescriptorStringValueCheckModeSchema,
  compareWithDescriptorValueCheckModeSchema,
  entityDescriptorSchema
} from '../checkModeSchema/checkModeSchema';
import { extendedDiscriminatedUnion } from '../extendedDiscriminatedUnion/extendedDiscriminatedUnion';
import { nestedObjectOrArraySchema } from '../nestedObjectOrArraySchema/nestedObjectOrArraySchema';
import { plainObjectSchema } from '../plainObjectSchema/plainObjectSchema';

/* ----- Plain entity schema ----- */

const plainEntityPrimitiveValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const plainEntityObjectiveValueSchema = nestedObjectOrArraySchema(plainEntityPrimitiveValueSchema);

const topLevelPlainEntityDescriptorSchema = extendedDiscriminatedUnion('checkMode', [
  entityDescriptorSchema(checkActualValueCheckModeSchema),
  entityDescriptorSchema(z.literal('function'), z.function()),
  entityDescriptorSchema(
    compareWithDescriptorAnyValueCheckModeSchema,
    plainEntityObjectiveValueSchema
  )
]);

const propertyLevelPlainEntityDescriptorSchema = extendedDiscriminatedUnion('checkMode', [
  entityDescriptorSchema(checkActualValueCheckModeSchema),
  entityDescriptorSchema(z.literal('function'), z.function()),
  entityDescriptorSchema(z.literal('regExp'), z.instanceof(RegExp)),
  entityDescriptorSchema(
    compareWithDescriptorAnyValueCheckModeSchema,
    z.union([plainEntityPrimitiveValueSchema, plainEntityObjectiveValueSchema])
  ),
  entityDescriptorSchema(
    compareWithDescriptorStringValueCheckModeSchema,
    plainEntityPrimitiveValueSchema
  )
]);

const nonCheckModeSchema = (schema: z.ZodTypeAny) =>
  z
    .custom((value) => typeof value === 'object')
    .superRefine((value, context) => {
      if (isPlainObject(value) && 'checkMode' in value) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['checkMode'],
          fatal: true
        });
        return z.NEVER;
      }
    })
    .pipe(schema);

const topLevelPlainEntityRecordSchema = nonCheckModeSchema(
  z.record(
    z.union([
      propertyLevelPlainEntityDescriptorSchema,
      nonCheckModeSchema(plainEntityObjectiveValueSchema),
      plainEntityPrimitiveValueSchema
    ])
  )
);

const topLevelPlainEntityArraySchema = z.array(
  z.union([plainEntityPrimitiveValueSchema, plainEntityObjectiveValueSchema])
);

export const bodyPlainEntitySchema = z.union([
  topLevelPlainEntityDescriptorSchema,
  topLevelPlainEntityRecordSchema,
  topLevelPlainEntityArraySchema
]);

export const variablesPlainEntitySchema = z.union([
  topLevelPlainEntityDescriptorSchema,
  topLevelPlainEntityRecordSchema
]);

/* ----- Mapped entity schema ----- */

const mappedEntityValueSchema = z.union([z.string(), z.number(), z.boolean()]);

const mappedEntityDescriptorSchema = extendedDiscriminatedUnion('checkMode', [
  entityDescriptorSchema(checkActualValueCheckModeSchema),
  entityDescriptorSchema(z.literal('function'), z.function()),
  entityDescriptorSchema(z.literal('regExp'), z.instanceof(RegExp)),
  entityDescriptorSchema(compareWithDescriptorValueCheckModeSchema, mappedEntityValueSchema)
]);

export const mappedEntitySchema = plainObjectSchema(
  z.record(z.union([mappedEntityValueSchema, mappedEntityDescriptorSchema]))
);
