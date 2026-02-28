import type {
  CalculateByDescriptorValueCheckMode,
  CheckActualValueCheckMode,
  CheckMode,
  CompareWithDescriptorAnyValueCheckMode,
  CompareWithDescriptorStringValueCheckMode,
  CompareWithDescriptorValueCheckMode,
  EntityFunctionDescriptorValue,
  MappedEntityDescriptor,
  MappedEntityValue,
  PlainEntityObjectiveValue,
  PlainEntityPrimitiveValue,
  PropertyLevelPlainEntityDescriptor,
  TopLevelPlainEntityDescriptor
} from '@/utils/types';

import { checkModeSymbol } from '@/utils/constants';

function mappedEntity(
  checkMode: CheckActualValueCheckMode
): MappedEntityDescriptor<CheckActualValueCheckMode>;

function mappedEntity(
  checkMode: CompareWithDescriptorValueCheckMode,
  value: MappedEntityValue,
  oneOf?: false
): MappedEntityDescriptor<CompareWithDescriptorValueCheckMode>;

function mappedEntity(
  checkMode: CompareWithDescriptorValueCheckMode,
  value: MappedEntityValue[],
  oneOf: true
): MappedEntityDescriptor<CompareWithDescriptorValueCheckMode>;

function mappedEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'regExp'>,
  value: RegExp,
  oneOf?: false
): MappedEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'regExp'>>;

function mappedEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'regExp'>,
  value: RegExp[],
  oneOf: true
): MappedEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'regExp'>>;

function mappedEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'function'>,
  value: EntityFunctionDescriptorValue<MappedEntityValue>,
  oneOf?: false
): MappedEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'function'>>;

function mappedEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'function'>,
  value: EntityFunctionDescriptorValue<MappedEntityValue>[],
  oneOf: true
): MappedEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'function'>>;

function mappedEntity(
  checkMode: CheckMode,
  value?:
    | EntityFunctionDescriptorValue<MappedEntityValue>
    | EntityFunctionDescriptorValue<MappedEntityValue>[]
    | MappedEntityValue
    | MappedEntityValue[]
    | RegExp
    | RegExp[],
  oneOf?: boolean
) {
  if (checkMode === 'exists' || checkMode === 'notExists') {
    return { [checkModeSymbol]: checkMode };
  }

  return {
    [checkModeSymbol]: checkMode,
    value,
    oneOf
  };
}

export const header = mappedEntity;
export const param = mappedEntity;
export const query = mappedEntity;
export const cookie = mappedEntity;

function topLevelPlainEntity(
  checkMode: CheckActualValueCheckMode
): TopLevelPlainEntityDescriptor<CheckActualValueCheckMode>;

function topLevelPlainEntity(
  checkMode: CompareWithDescriptorAnyValueCheckMode,
  value: PlainEntityObjectiveValue,
  oneOf?: false
): TopLevelPlainEntityDescriptor<CompareWithDescriptorAnyValueCheckMode>;

function topLevelPlainEntity(
  checkMode: CompareWithDescriptorAnyValueCheckMode,
  value: PlainEntityObjectiveValue[],
  oneOf: true
): TopLevelPlainEntityDescriptor<CompareWithDescriptorAnyValueCheckMode>;

function topLevelPlainEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'function'>,
  value: EntityFunctionDescriptorValue<PlainEntityObjectiveValue>,
  oneOf?: false
): TopLevelPlainEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'function'>>;

function topLevelPlainEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'function'>,
  value: EntityFunctionDescriptorValue<PlainEntityObjectiveValue>[],
  oneOf: true
): TopLevelPlainEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'function'>>;

function topLevelPlainEntity(
  checkMode: CheckMode,
  value?:
    | EntityFunctionDescriptorValue<PlainEntityObjectiveValue>
    | EntityFunctionDescriptorValue<PlainEntityObjectiveValue>[]
    | PlainEntityObjectiveValue
    | PlainEntityObjectiveValue[],
  oneOf?: boolean
) {
  if (checkMode === 'exists' || checkMode === 'notExists') {
    return { [checkModeSymbol]: checkMode };
  }
  return {
    [checkModeSymbol]: checkMode,
    value,
    oneOf
  };
}

export const body = topLevelPlainEntity;
export const variables = topLevelPlainEntity;

function propertyLevelPlainEntity(
  checkMode: CheckActualValueCheckMode
): PropertyLevelPlainEntityDescriptor<CheckActualValueCheckMode>;

function propertyLevelPlainEntity(
  checkMode: CompareWithDescriptorAnyValueCheckMode,
  value: PlainEntityObjectiveValue | PlainEntityPrimitiveValue,
  oneOf?: false
): PropertyLevelPlainEntityDescriptor<CompareWithDescriptorAnyValueCheckMode>;

function propertyLevelPlainEntity(
  checkMode: CompareWithDescriptorAnyValueCheckMode,
  value: (PlainEntityObjectiveValue | PlainEntityPrimitiveValue)[],
  oneOf: true
): PropertyLevelPlainEntityDescriptor<CompareWithDescriptorAnyValueCheckMode>;

function propertyLevelPlainEntity(
  checkMode: CompareWithDescriptorStringValueCheckMode,
  value: PlainEntityPrimitiveValue,
  oneOf?: false
): PropertyLevelPlainEntityDescriptor<CompareWithDescriptorStringValueCheckMode>;

function propertyLevelPlainEntity(
  checkMode: CompareWithDescriptorStringValueCheckMode,
  value: PlainEntityPrimitiveValue[],
  oneOf: true
): PropertyLevelPlainEntityDescriptor<CompareWithDescriptorStringValueCheckMode>;

function propertyLevelPlainEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'regExp'>,
  value: RegExp,
  oneOf?: false
): PropertyLevelPlainEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'regExp'>>;

function propertyLevelPlainEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'regExp'>,
  value: RegExp[],
  oneOf: true
): PropertyLevelPlainEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'regExp'>>;

function propertyLevelPlainEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'function'>,
  value: EntityFunctionDescriptorValue<PlainEntityObjectiveValue | PlainEntityPrimitiveValue>,
  oneOf?: false
): PropertyLevelPlainEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'function'>>;

function propertyLevelPlainEntity(
  checkMode: Extract<CalculateByDescriptorValueCheckMode, 'function'>,
  value: EntityFunctionDescriptorValue<PlainEntityObjectiveValue | PlainEntityPrimitiveValue>[],
  oneOf: true
): PropertyLevelPlainEntityDescriptor<Extract<CalculateByDescriptorValueCheckMode, 'function'>>;

function propertyLevelPlainEntity(
  checkMode: CheckMode,
  value?:
    | (PlainEntityObjectiveValue | PlainEntityPrimitiveValue)[]
    | EntityFunctionDescriptorValue<PlainEntityObjectiveValue | PlainEntityPrimitiveValue>
    | EntityFunctionDescriptorValue<PlainEntityObjectiveValue | PlainEntityPrimitiveValue>[]
    | PlainEntityObjectiveValue
    | PlainEntityPrimitiveValue
    | PlainEntityPrimitiveValue[]
    | RegExp
    | RegExp[],
  oneOf?: boolean
) {
  if (checkMode === 'exists' || checkMode === 'notExists') {
    return { [checkModeSymbol]: checkMode };
  }
  return {
    [checkModeSymbol]: checkMode,
    value,
    oneOf
  };
}

export const bodyProperty = propertyLevelPlainEntity;
export const variablesProperty = propertyLevelPlainEntity;
