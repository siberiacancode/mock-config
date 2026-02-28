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
    get checkActualValueCheckModeSchema () {
        return checkActualValueCheckModeSchema;
    },
    get compareWithDescriptorAnyValueCheckModeSchema () {
        return compareWithDescriptorAnyValueCheckModeSchema;
    },
    get compareWithDescriptorStringValueCheckModeSchema () {
        return compareWithDescriptorStringValueCheckModeSchema;
    },
    get compareWithDescriptorValueCheckModeSchema () {
        return compareWithDescriptorValueCheckModeSchema;
    },
    get entityDescriptorSchema () {
        return entityDescriptorSchema;
    }
});
const _zod = require("zod");
const _constants = require("../../../constants");
const checkActualValueCheckModeSchema = _zod.z.enum(_constants.CHECK_ACTUAL_VALUE_CHECK_MODES);
const compareWithDescriptorAnyValueCheckModeSchema = _zod.z.enum(_constants.COMPARE_WITH_DESCRIPTOR_ANY_VALUE_CHECK_MODES);
const compareWithDescriptorStringValueCheckModeSchema = _zod.z.enum(_constants.COMPARE_WITH_DESCRIPTOR_STRING_VALUE_CHECK_MODES);
const compareWithDescriptorValueCheckModeSchema = _zod.z.enum(_constants.COMPARE_WITH_DESCRIPTOR_VALUE_CHECK_MODES);
const entityDescriptorSchema = (checkModeSchema, valueSchema)=>{
    const isCheckActualValueCheckMode = !valueSchema;
    if (isCheckActualValueCheckMode) {
        return _zod.z.strictObject({
            checkMode: checkModeSchema
        });
    }
    return _zod.z.discriminatedUnion('oneOf', [
        _zod.z.strictObject({
            checkMode: checkModeSchema,
            value: valueSchema,
            oneOf: _zod.z.literal(false).optional()
        }),
        _zod.z.strictObject({
            checkMode: checkModeSchema,
            value: _zod.z.array(valueSchema),
            oneOf: _zod.z.literal(true)
        })
    ]);
};
