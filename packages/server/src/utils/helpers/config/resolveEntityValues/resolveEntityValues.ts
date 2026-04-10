import { flatten } from 'flat';

import type {
  CheckActualValueCheckMode,
  CheckFunction,
  CheckMode,
  EntityFunctionDescriptorValue,
  PlainObject
} from '@/utils/types';

import { checkModeSymbol, NEGATIVE_CHECK_MODES } from '@/utils/constants';

import { isPlainObject } from '../../isPlainObject/isPlainObject';
import { isPrimitive } from '../../isPrimitive/isPrimitive';

const checkFunction: CheckFunction = (checkMode, actualValue, descriptorValue?) => {
  const isActualValueUndefined = actualValue === undefined;
  if (checkMode === 'exists') return !isActualValueUndefined;
  if (checkMode === 'notExists') return isActualValueUndefined;

  if (checkMode === 'function') {
    return (descriptorValue as EntityFunctionDescriptorValue<typeof actualValue>)(
      actualValue,
      checkFunction
    );
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

const compareEntityValues = (checkMode: CheckMode, actualValue: any, descriptorValue?: any) => {
  if (checkMode === 'exists' || checkMode === 'notExists') {
    return checkFunction(checkMode, actualValue);
  }

  if (checkMode === 'function') {
    return !!descriptorValue(actualValue, checkFunction);
  }

  if (checkMode === 'regExp') {
    return checkFunction(checkMode, actualValue, descriptorValue);
  }

  const isActualValuePrimitive = isPrimitive(actualValue);
  const isDescriptorValuePrimitive = isPrimitive(descriptorValue);
  if (isActualValuePrimitive && isDescriptorValuePrimitive) {
    return checkFunction(checkMode, actualValue, descriptorValue);
  }

  const isActualValueObject = isPlainObject(actualValue) || Array.isArray(actualValue);
  const isDescriptorValueObject = isPlainObject(descriptorValue) || Array.isArray(descriptorValue);
  const isNegativeCheckMode = NEGATIVE_CHECK_MODES.includes(
    checkMode as (typeof NEGATIVE_CHECK_MODES)[number]
  );
  if (isActualValueObject && isDescriptorValueObject) {
    const flattenActualValue = flatten<PlainObject | unknown[], PlainObject>(actualValue);
    const flattenDescriptorValue = flatten<PlainObject | unknown[], PlainObject>(descriptorValue);

    if (Object.keys(flattenActualValue).length !== Object.keys(flattenDescriptorValue).length) {
      return isNegativeCheckMode;
    }

    return Object.keys(flattenDescriptorValue)[isNegativeCheckMode ? 'some' : 'every'](
      (flattenDescriptorValueKey) =>
        checkFunction(
          checkMode,
          flattenActualValue[flattenDescriptorValueKey],
          flattenDescriptorValue[flattenDescriptorValueKey]
        )
    );
  }

  return isNegativeCheckMode;
};

type ResolveEntityValuesParams<Check extends CheckMode = CheckMode> =
  Check extends CheckActualValueCheckMode
    ? {
        actualValue: unknown;
        [checkModeSymbol]: Check;
      }
    : {
        actualValue: unknown;
        [checkModeSymbol]: Check;
        descriptorValue: unknown;
      };

export const resolveEntityValues = (params: ResolveEntityValuesParams) => {
  if (params[checkModeSymbol] === 'exists' || params[checkModeSymbol] === 'notExists') {
    return compareEntityValues(params[checkModeSymbol], params.actualValue);
  }
  return compareEntityValues(params[checkModeSymbol], params.actualValue, params.descriptorValue);
};
