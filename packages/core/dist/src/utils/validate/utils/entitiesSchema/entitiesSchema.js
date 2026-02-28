"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get bodyPlainEntitySchema () {
        return bodyPlainEntitySchema;
    },
    get mappedEntitySchema () {
        return mappedEntitySchema;
    },
    get variablesPlainEntitySchema () {
        return variablesPlainEntitySchema;
    }
});
const _zod = require("zod");
const _helpers = require("../../../helpers");
const _checkModeSchema = require("../checkModeSchema/checkModeSchema");
const _extendedDiscriminatedUnion = require("../extendedDiscriminatedUnion/extendedDiscriminatedUnion");
const _nestedObjectOrArraySchema = require("../nestedObjectOrArraySchema/nestedObjectOrArraySchema");
const _plainObjectSchema = require("../plainObjectSchema/plainObjectSchema");
/* ----- Plain entity schema ----- */ const plainEntityPrimitiveValueSchema = _zod.z.union([
    _zod.z.string(),
    _zod.z.number(),
    _zod.z.boolean(),
    _zod.z.null()
]);
const plainEntityObjectiveValueSchema = (0, _nestedObjectOrArraySchema.nestedObjectOrArraySchema)(plainEntityPrimitiveValueSchema);
const topLevelPlainEntityDescriptorSchema = (0, _extendedDiscriminatedUnion.extendedDiscriminatedUnion)('checkMode', [
    (0, _checkModeSchema.entityDescriptorSchema)(_checkModeSchema.checkActualValueCheckModeSchema),
    (0, _checkModeSchema.entityDescriptorSchema)(_zod.z.literal('function'), _zod.z.function()),
    (0, _checkModeSchema.entityDescriptorSchema)(_checkModeSchema.compareWithDescriptorAnyValueCheckModeSchema, plainEntityObjectiveValueSchema)
]);
const propertyLevelPlainEntityDescriptorSchema = (0, _extendedDiscriminatedUnion.extendedDiscriminatedUnion)('checkMode', [
    (0, _checkModeSchema.entityDescriptorSchema)(_checkModeSchema.checkActualValueCheckModeSchema),
    (0, _checkModeSchema.entityDescriptorSchema)(_zod.z.literal('function'), _zod.z.function()),
    (0, _checkModeSchema.entityDescriptorSchema)(_zod.z.literal('regExp'), _zod.z.instanceof(RegExp)),
    (0, _checkModeSchema.entityDescriptorSchema)(_checkModeSchema.compareWithDescriptorAnyValueCheckModeSchema, _zod.z.union([
        plainEntityPrimitiveValueSchema,
        plainEntityObjectiveValueSchema
    ])),
    (0, _checkModeSchema.entityDescriptorSchema)(_checkModeSchema.compareWithDescriptorStringValueCheckModeSchema, plainEntityPrimitiveValueSchema)
]);
const nonCheckModeSchema = (schema)=>_zod.z.custom((value)=>typeof value === 'object').superRefine((value, context)=>{
        if ((0, _helpers.isPlainObject)(value) && 'checkMode' in value) {
            context.addIssue({
                code: _zod.z.ZodIssueCode.custom,
                path: [
                    'checkMode'
                ],
                fatal: true
            });
            return _zod.z.NEVER;
        }
    }).pipe(schema);
const topLevelPlainEntityRecordSchema = nonCheckModeSchema(_zod.z.record(_zod.z.union([
    propertyLevelPlainEntityDescriptorSchema,
    nonCheckModeSchema(plainEntityObjectiveValueSchema),
    plainEntityPrimitiveValueSchema
])));
const topLevelPlainEntityArraySchema = _zod.z.array(_zod.z.union([
    plainEntityPrimitiveValueSchema,
    plainEntityObjectiveValueSchema
]));
const bodyPlainEntitySchema = _zod.z.union([
    topLevelPlainEntityDescriptorSchema,
    topLevelPlainEntityRecordSchema,
    topLevelPlainEntityArraySchema
]);
const variablesPlainEntitySchema = _zod.z.union([
    topLevelPlainEntityDescriptorSchema,
    topLevelPlainEntityRecordSchema
]);
/* ----- Mapped entity schema ----- */ const mappedEntityValueSchema = _zod.z.union([
    _zod.z.string(),
    _zod.z.number(),
    _zod.z.boolean()
]);
const mappedEntityDescriptorSchema = (0, _extendedDiscriminatedUnion.extendedDiscriminatedUnion)('checkMode', [
    (0, _checkModeSchema.entityDescriptorSchema)(_checkModeSchema.checkActualValueCheckModeSchema),
    (0, _checkModeSchema.entityDescriptorSchema)(_zod.z.literal('function'), _zod.z.function()),
    (0, _checkModeSchema.entityDescriptorSchema)(_zod.z.literal('regExp'), _zod.z.instanceof(RegExp)),
    (0, _checkModeSchema.entityDescriptorSchema)(_checkModeSchema.compareWithDescriptorValueCheckModeSchema, mappedEntityValueSchema)
]);
const mappedEntitySchema = (0, _plainObjectSchema.plainObjectSchema)(_zod.z.record(_zod.z.union([
    mappedEntityValueSchema,
    mappedEntityDescriptorSchema
])));
