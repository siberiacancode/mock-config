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
  // todo add noCheckMode check here
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

// A more idiomatic Zod v4 approach is to use .refine on z.object() to ensure it does not have 'checkMode' as a key.
// We can also use .passthrough() to allow extra fields, but block 'checkMode' specifically.

const nonCheckModeSchema = (schema: z.ZodTypeAny) =>
  z
    .object({})
    .passthrough()
    .refine((obj) => !Object.prototype.hasOwnProperty.call(obj, 'checkMode'), {
      message: "Object must not contain 'checkMode' property",
      path: ['checkMode']
    })
    .or(schema);

const topLevelPlainEntityRecordSchema = nonCheckModeSchema(
  z.record(
    z.string(),
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
