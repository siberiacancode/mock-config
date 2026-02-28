import type {
  CalculateByDescriptorValueCheckMode,
  CheckActualValueCheckMode,
  CheckMode,
  CompareWithDescriptorAnyValueCheckMode,
  CompareWithDescriptorStringValueCheckMode,
  CompareWithDescriptorValueCheckMode
} from '@/utils/types';

export const CHECK_ACTUAL_VALUE_CHECK_MODES = [
  'exists',
  'notExists'
] as const satisfies readonly CheckActualValueCheckMode[];

export const COMPARE_WITH_DESCRIPTOR_ANY_VALUE_CHECK_MODES = [
  'equals',
  'notEquals'
] as const satisfies readonly CompareWithDescriptorAnyValueCheckMode[];

export const COMPARE_WITH_DESCRIPTOR_STRING_VALUE_CHECK_MODES = [
  'includes',
  'notIncludes',
  'startsWith',
  'notStartsWith',
  'endsWith',
  'notEndsWith'
] as const satisfies readonly CompareWithDescriptorStringValueCheckMode[];

export const COMPARE_WITH_DESCRIPTOR_VALUE_CHECK_MODES = [
  ...COMPARE_WITH_DESCRIPTOR_ANY_VALUE_CHECK_MODES,
  ...COMPARE_WITH_DESCRIPTOR_STRING_VALUE_CHECK_MODES
] as const satisfies readonly CompareWithDescriptorValueCheckMode[];

export const CALCULATE_BY_DESCRIPTOR_VALUE_CHECK_MODES = [
  'regExp',
  'function'
] as const satisfies readonly CalculateByDescriptorValueCheckMode[];

export const NEGATIVE_CHECK_MODES = [
  'notExists',
  'notEquals',
  'notIncludes',
  'notStartsWith',
  'notEndsWith'
] as const satisfies readonly CheckMode[];
