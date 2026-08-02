import { z } from 'zod';

import {
  checkActualValueCheckModeSchema,
  compareWithDescriptorAnyValueCheckModeSchema,
  compareWithDescriptorStringValueCheckModeSchema,
  compareWithDescriptorValueCheckModeSchema,
  entityDescriptorSchema
} from '../checkModeSchema/checkModeSchema';

/* ----- Plain entity schema ----- */

const plainEntityPrimitiveValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const plainEntityObjectiveValueSchema = z.union([
  z.array(z.json()),
  z.record(z.string(), z.json())
]);

const topLevelPlainEntityDescriptorSchema = z.discriminatedUnion('checkMode', [
  entityDescriptorSchema(checkActualValueCheckModeSchema),
  entityDescriptorSchema(z.literal('function'), z.function()),
  entityDescriptorSchema(
    compareWithDescriptorAnyValueCheckModeSchema,
    plainEntityObjectiveValueSchema
  )
]);

const propertyLevelPlainEntityDescriptorSchema = z.discriminatedUnion('checkMode', [
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

const withoutCheckModeSchema = (schema: z.ZodObject<any> | z.ZodRecord<any> | z.ZodUnion<any>) =>
  z
    .looseObject({})
    .refine((value) => !('checkMode' in value))
    .pipe(schema);

const topLevelPlainEntityRecordSchema = withoutCheckModeSchema(
  z.record(
    z.string(),
    z.union([
      propertyLevelPlainEntityDescriptorSchema,
      withoutCheckModeSchema(plainEntityObjectiveValueSchema),
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

const mappedEntityDescriptorSchema = z.discriminatedUnion('checkMode', [
  entityDescriptorSchema(checkActualValueCheckModeSchema),
  entityDescriptorSchema(z.literal('function'), z.function()),
  entityDescriptorSchema(z.literal('regExp'), z.instanceof(RegExp)),
  entityDescriptorSchema(compareWithDescriptorValueCheckModeSchema, mappedEntityValueSchema)
]);

export const mappedEntitySchema = z.record(
  z.string(),
  z.union([mappedEntityValueSchema, mappedEntityDescriptorSchema])
);
