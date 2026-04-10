import type {
  CheckFunction,
  EntitiesDescriptor,
  EntityDescriptor,
  MappedEntity
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

export function equals<Value>(value: Value): EntityDescriptor<'equals', Value> {
  return {
    [checkModeSymbol]: 'equals',
    value
  } as EntityDescriptor<'equals', Value>;
}

export function notEquals<Value>(value: Value): EntityDescriptor<'notEquals', Value> {
  return {
    [checkModeSymbol]: 'notEquals',
    value
  } as EntityDescriptor<'notEquals', Value>;
}

export function includes<Value>(value: Value): EntityDescriptor<'includes', Value> {
  return {
    [checkModeSymbol]: 'includes',
    value
  } as EntityDescriptor<'includes', Value>;
}

export function notIncludes<Value>(value: Value): EntityDescriptor<'notIncludes', Value> {
  return {
    [checkModeSymbol]: 'notIncludes',
    value
  } as EntityDescriptor<'notIncludes', Value>;
}

export function startsWith<Value>(value: Value): EntityDescriptor<'startsWith', Value> {
  return {
    [checkModeSymbol]: 'startsWith',
    value
  } as EntityDescriptor<'startsWith', Value>;
}

export function notStartsWith<Value>(value: Value): EntityDescriptor<'notStartsWith', Value> {
  return {
    [checkModeSymbol]: 'notStartsWith',
    value
  } as EntityDescriptor<'notStartsWith', Value>;
}

export function endsWith<Value>(value: Value): EntityDescriptor<'endsWith', Value> {
  return {
    [checkModeSymbol]: 'endsWith',
    value
  } as EntityDescriptor<'endsWith', Value>;
}

export function notEndsWith<Value>(value: Value): EntityDescriptor<'notEndsWith', Value> {
  return {
    [checkModeSymbol]: 'notEndsWith',
    value
  } as EntityDescriptor<'notEndsWith', Value>;
}

export function regExp<Value>(value: Value): EntityDescriptor<'regExp', Value> {
  return {
    [checkModeSymbol]: 'regExp',
    value
  } as EntityDescriptor<'regExp', Value>;
}

export function fn<Value>(value: Value): EntityDescriptor<'function', Value> {
  return {
    [checkModeSymbol]: 'function',
    value
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

export const oneOf = (...descriptors: EntityDescriptor[]): EntityDescriptor<'function'> => ({
  [checkModeSymbol]: 'function',
  value: (actualValue: any, checkFunction: CheckFunction) =>
    descriptors.some((descriptor) => {
      if (descriptor[checkModeSymbol] === 'exists' || descriptor[checkModeSymbol] === 'notExists') {
        return checkFunction(descriptor[checkModeSymbol], actualValue);
      }
      return checkFunction(descriptor[checkModeSymbol], actualValue, descriptor.value);
    })
});
