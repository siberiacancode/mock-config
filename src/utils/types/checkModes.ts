import type { checkModeSymbol } from '@/utils/constants';

export type CheckActualValueCheckMode = 'exists' | 'notExists';

export type CompareWithDescriptorAnyValueCheckMode = 'equals' | 'notEquals';

export type CompareWithDescriptorStringValueCheckMode =
  | 'endsWith'
  | 'includes'
  | 'notEndsWith'
  | 'notIncludes'
  | 'notStartsWith'
  | 'startsWith';

export type CompareWithDescriptorValueCheckMode =
  | CompareWithDescriptorAnyValueCheckMode
  | CompareWithDescriptorStringValueCheckMode;

export type CalculateByDescriptorValueCheckMode = 'function' | 'regExp';

export type CheckMode =
  | CalculateByDescriptorValueCheckMode
  | CheckActualValueCheckMode
  | CompareWithDescriptorValueCheckMode;

export type EntityDescriptor<
  Check extends CheckMode = CheckMode,
  Value = any
> = Check extends CheckActualValueCheckMode
  ? { [checkModeSymbol]: Check }
  :
      | { [checkModeSymbol]: Check; value: Value; oneOf?: false }
      | { [checkModeSymbol]: Check; value: Value[]; oneOf: true };

export type CheckFunction = <ActualValue = any, DescriptorValue = any>(
  checkMode: CheckMode,
  actualValue: ActualValue,
  descriptorValue?: DescriptorValue
) => boolean;
