"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "resolveEntityValues", {
    enumerable: true,
    get: function() {
        return resolveEntityValues;
    }
});
const _flat = require("flat");
const _constants = require("../../../constants");
const _isPlainObject = require("../../isPlainObject/isPlainObject");
const _isPrimitive = require("../../isPrimitive/isPrimitive");
const checkFunction = (checkMode, actualValue, descriptorValue)=>{
    const isActualValueUndefined = typeof actualValue === 'undefined';
    if (checkMode === 'exists') return !isActualValueUndefined;
    if (checkMode === 'notExists') return isActualValueUndefined;
    if (checkMode === 'function') {
        return !!descriptorValue(actualValue, checkFunction);
    }
    const actualValueString = String(actualValue);
    if (checkMode === 'regExp' && descriptorValue instanceof RegExp) {
        return new RegExp(descriptorValue).test(actualValueString);
    }
    // ✅ important:
    // cast values to string for ignore types of values
    const descriptorValueString = String(descriptorValue);
    if (checkMode === 'equals') return actualValueString === descriptorValueString;
    if (checkMode === 'notEquals') return actualValueString !== descriptorValueString;
    if (checkMode === 'includes') return actualValueString.includes(descriptorValueString);
    if (checkMode === 'notIncludes') return !actualValueString.includes(descriptorValueString);
    if (checkMode === 'startsWith') return actualValueString.startsWith(descriptorValueString);
    if (checkMode === 'notStartsWith') return !actualValueString.startsWith(descriptorValueString);
    if (checkMode === 'endsWith') return actualValueString.endsWith(descriptorValueString);
    if (checkMode === 'notEndsWith') return !actualValueString.endsWith(descriptorValueString);
    throw new Error(`Wrong checkMode ${checkMode}`);
};
const compareEntityValues = (checkMode, actualValue, descriptorValue)=>{
    if (checkMode === 'exists' || checkMode === 'notExists') {
        return checkFunction(checkMode, actualValue);
    }
    if (checkMode === 'function') {
        return !!descriptorValue(actualValue, checkFunction);
    }
    if (checkMode === 'regExp') {
        return checkFunction(checkMode, actualValue, descriptorValue);
    }
    const isActualValuePrimitive = (0, _isPrimitive.isPrimitive)(actualValue);
    const isDescriptorValuePrimitive = (0, _isPrimitive.isPrimitive)(descriptorValue);
    if (isActualValuePrimitive && isDescriptorValuePrimitive) {
        return checkFunction(checkMode, actualValue, descriptorValue);
    }
    const isActualValueObject = (0, _isPlainObject.isPlainObject)(actualValue) || Array.isArray(actualValue);
    const isDescriptorValueObject = (0, _isPlainObject.isPlainObject)(descriptorValue) || Array.isArray(descriptorValue);
    const isNegativeCheckMode = _constants.NEGATIVE_CHECK_MODES.includes(checkMode);
    if (isActualValueObject && isDescriptorValueObject) {
        const flattenActualValue = (0, _flat.flatten)(actualValue);
        const flattenDescriptorValue = (0, _flat.flatten)(descriptorValue);
        if (Object.keys(flattenActualValue).length !== Object.keys(flattenDescriptorValue).length) {
            return isNegativeCheckMode;
        }
        return Object.keys(flattenDescriptorValue)[isNegativeCheckMode ? 'some' : 'every']((flattenDescriptorValueKey)=>checkFunction(checkMode, flattenActualValue[flattenDescriptorValueKey], flattenDescriptorValue[flattenDescriptorValueKey]));
    }
    return isNegativeCheckMode;
};
const resolveEntityValues = (params)=>{
    const { checkMode, actualValue } = params;
    if (checkMode === 'exists' || checkMode === 'notExists') {
        return compareEntityValues(checkMode, actualValue);
    }
    const { oneOf, descriptorValue } = params;
    if (!oneOf) {
        return compareEntityValues(checkMode, actualValue, descriptorValue);
    }
    return descriptorValue.some((descriptorValueElement)=>compareEntityValues(checkMode, actualValue, descriptorValueElement));
};
