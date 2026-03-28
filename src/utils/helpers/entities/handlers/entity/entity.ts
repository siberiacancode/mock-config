import type {
  EntitiesDescriptor,
  EntityDescriptor,
  EntityFunctionDescriptorValue,
  MappedEntity,
  MappedEntityValue,
  PlainEntityObjectiveValue,
  PlainEntityPrimitiveValue
} from '@/utils/types';

import { checkModeSymbol } from '@/utils/constants';

export function exists(): EntityDescriptor<'exists'> {
  return {
    [checkModeSymbol]: 'exists'
  };
}

export function notExists(): EntityDescriptor<'notExists'> {
  return {
    [checkModeSymbol]: 'notExists'
  };
}

type PrimitiveOrNestedObjectOrArray =
  | MappedEntityValue
  | PlainEntityObjectiveValue
  | PlainEntityPrimitiveValue;

export function equals<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'equals', Value>;
export function equals<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'equals', Value>;
export function equals<Value>(value: Value, oneOf?: boolean): EntityDescriptor<'equals', Value> {
  return {
    [checkModeSymbol]: 'equals',
    value,
    oneOf
  } as EntityDescriptor<'equals', Value>;
}

export function notEquals<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'notEquals', Value>;
export function notEquals<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'notEquals', Value>;
export function notEquals<Value>(
  value: Value,
  oneOf?: boolean
): EntityDescriptor<'notEquals', Value> {
  return {
    [checkModeSymbol]: 'notEquals',
    value,
    oneOf
  } as EntityDescriptor<'notEquals', Value>;
}

export function includes<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'includes', Value>;
export function includes<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'includes', Value>;
export function includes<Value>(
  value: Value,
  oneOf?: boolean
): EntityDescriptor<'includes', Value> {
  return {
    [checkModeSymbol]: 'includes',
    value,
    oneOf
  } as EntityDescriptor<'includes', Value>;
}

export function notIncludes<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'notIncludes', Value>;
export function notIncludes<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'notIncludes', Value>;
export function notIncludes<Value>(
  value: Value,
  oneOf?: boolean
): EntityDescriptor<'notIncludes', Value> {
  return {
    [checkModeSymbol]: 'notIncludes',
    value,
    oneOf
  } as EntityDescriptor<'notIncludes', Value>;
}

export function startsWith<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'startsWith', Value>;
export function startsWith<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'startsWith', Value>;
export function startsWith<Value>(
  value: Value,
  oneOf?: boolean
): EntityDescriptor<'startsWith', Value> {
  return {
    [checkModeSymbol]: 'startsWith',
    value,
    oneOf
  } as EntityDescriptor<'startsWith', Value>;
}

export function notStartsWith<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'notStartsWith', Value>;
export function notStartsWith<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'notStartsWith', Value>;
export function notStartsWith<Value>(
  value: Value,
  oneOf?: boolean
): EntityDescriptor<'notStartsWith', Value> {
  return {
    [checkModeSymbol]: 'notStartsWith',
    value,
    oneOf
  } as EntityDescriptor<'notStartsWith', Value>;
}

export function endsWith<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'endsWith', Value>;
export function endsWith<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'endsWith', Value>;
export function endsWith<Value>(
  value: Value,
  oneOf?: boolean
): EntityDescriptor<'endsWith', Value> {
  return {
    [checkModeSymbol]: 'endsWith',
    value,
    oneOf
  } as EntityDescriptor<'endsWith', Value>;
}

export function notEndsWith<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'notEndsWith', Value>;
export function notEndsWith<Value extends PrimitiveOrNestedObjectOrArray>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'notEndsWith', Value>;
export function notEndsWith<Value>(
  value: Value,
  oneOf?: boolean
): EntityDescriptor<'notEndsWith', Value> {
  return {
    [checkModeSymbol]: 'notEndsWith',
    value,
    oneOf
  } as EntityDescriptor<'notEndsWith', Value>;
}

export function regExp<Value extends RegExp>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'regExp', Value>;
export function regExp<Value extends RegExp>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'regExp', Value>;
export function regExp<Value>(value: Value, oneOf?: boolean): EntityDescriptor<'regExp', Value> {
  return {
    [checkModeSymbol]: 'regExp',
    value,
    oneOf
  } as EntityDescriptor<'regExp', Value>;
}

export function fn<Value extends EntityFunctionDescriptorValue<Value>>(
  value: Value,
  oneOf?: false
): EntityDescriptor<'function', Value>;
export function fn<Value extends EntityFunctionDescriptorValue<Value>>(
  value: Value[],
  oneOf: true
): EntityDescriptor<'function', Value>;
export function fn<Value>(value: Value, oneOf?: boolean): EntityDescriptor<'function', Value> {
  return {
    [checkModeSymbol]: 'function',
    value,
    oneOf
  } as EntityDescriptor<'function', Value>;
}

export function every<Value extends MappedEntity>(
  value: Value
): EntitiesDescriptor<'every', MappedEntity> {
  return {
    [checkModeSymbol]: 'every',
    value
  };
}

export function some<Value extends MappedEntity>(
  value: Value
): EntitiesDescriptor<'some', MappedEntity> {
  return {
    [checkModeSymbol]: 'some',
    value
  };
}
