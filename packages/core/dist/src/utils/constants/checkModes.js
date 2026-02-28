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
    get CALCULATE_BY_DESCRIPTOR_VALUE_CHECK_MODES () {
        return CALCULATE_BY_DESCRIPTOR_VALUE_CHECK_MODES;
    },
    get CHECK_ACTUAL_VALUE_CHECK_MODES () {
        return CHECK_ACTUAL_VALUE_CHECK_MODES;
    },
    get COMPARE_WITH_DESCRIPTOR_ANY_VALUE_CHECK_MODES () {
        return COMPARE_WITH_DESCRIPTOR_ANY_VALUE_CHECK_MODES;
    },
    get COMPARE_WITH_DESCRIPTOR_STRING_VALUE_CHECK_MODES () {
        return COMPARE_WITH_DESCRIPTOR_STRING_VALUE_CHECK_MODES;
    },
    get COMPARE_WITH_DESCRIPTOR_VALUE_CHECK_MODES () {
        return COMPARE_WITH_DESCRIPTOR_VALUE_CHECK_MODES;
    },
    get NEGATIVE_CHECK_MODES () {
        return NEGATIVE_CHECK_MODES;
    }
});
const CHECK_ACTUAL_VALUE_CHECK_MODES = [
    'exists',
    'notExists'
];
const COMPARE_WITH_DESCRIPTOR_ANY_VALUE_CHECK_MODES = [
    'equals',
    'notEquals'
];
const COMPARE_WITH_DESCRIPTOR_STRING_VALUE_CHECK_MODES = [
    'includes',
    'notIncludes',
    'startsWith',
    'notStartsWith',
    'endsWith',
    'notEndsWith'
];
const COMPARE_WITH_DESCRIPTOR_VALUE_CHECK_MODES = [
    ...COMPARE_WITH_DESCRIPTOR_ANY_VALUE_CHECK_MODES,
    ...COMPARE_WITH_DESCRIPTOR_STRING_VALUE_CHECK_MODES
];
const CALCULATE_BY_DESCRIPTOR_VALUE_CHECK_MODES = [
    'regExp',
    'function'
];
const NEGATIVE_CHECK_MODES = [
    'notExists',
    'notEquals',
    'notIncludes',
    'notStartsWith',
    'notEndsWith'
];
