import type { checkModeSymbol } from '@/utils/constants';

import type {
  CheckActualValueCheckMode,
  CheckFunction,
  CheckMode,
  CompareWithDescriptorAnyValueCheckMode,
  CompareWithDescriptorStringValueCheckMode,
  CompareWithDescriptorValueCheckMode,
  EntitiesCheckMode,
  EntitiesDescriptor,
  EntityDescriptor
} from './checkModes';
import type { NestedObjectOrArray } from './utils';

/* ----- Plain entity ----- */

export type PlainEntityPrimitiveValue = boolean | number | string | null;
export type PlainEntityObjectiveValue = NestedObjectOrArray<PlainEntityPrimitiveValue>;

export type EntityFunctionDescriptorValue<ActualValue> = (
  actualValue: ActualValue,
  checkFunction: CheckFunction
) => boolean;

export type TopLevelPlainEntityDescriptor<Check extends CheckMode = CheckMode> =
  Check extends 'function'
    ? EntityDescriptor<Check, EntityFunctionDescriptorValue<PlainEntityObjectiveValue>>
    : Check extends CompareWithDescriptorAnyValueCheckMode
      ? EntityDescriptor<Check, PlainEntityObjectiveValue>
      : Check extends CheckActualValueCheckMode
        ? EntityDescriptor<Check>
        : never;

export type PropertyLevelPlainEntityDescriptor<Check extends CheckMode = CheckMode> =
  Check extends 'function'
    ? EntityDescriptor<
      Check,
      EntityFunctionDescriptorValue<PlainEntityObjectiveValue | PlainEntityPrimitiveValue>
    >
    : Check extends 'regExp'
      ? EntityDescriptor<Check, RegExp>
      : Check extends CompareWithDescriptorAnyValueCheckMode
        ? EntityDescriptor<Check, PlainEntityObjectiveValue | PlainEntityPrimitiveValue>
        : Check extends CompareWithDescriptorStringValueCheckMode
          ? EntityDescriptor<Check, PlainEntityPrimitiveValue>
          : Check extends CheckActualValueCheckMode
            ? EntityDescriptor<Check>
            : never;

type NonCheckMode<T extends object> = T & { checkMode?: never; [checkModeSymbol]?: never };

type TopLevelPlainEntityRecord = NonCheckMode<
  Record<
    string,
    | NonCheckMode<PlainEntityObjectiveValue>
    | PlainEntityPrimitiveValue
    | PropertyLevelPlainEntityDescriptor
  >
>;

export type TopLevelPlainEntityArray = Array<PlainEntityObjectiveValue | PlainEntityPrimitiveValue>;

export type BodyPlainEntity =
  | TopLevelPlainEntityArray
  | TopLevelPlainEntityDescriptor
  | TopLevelPlainEntityRecord;

export type VariablesPlainEntity = TopLevelPlainEntityDescriptor | TopLevelPlainEntityRecord;

/* ----- Mapped entity ----- */

export type MappedEntityValue = boolean | number | string;

export type MappedEntityDescriptor<Check extends CheckMode = CheckMode> = Check extends 'function'
  ? EntityDescriptor<Check, EntityFunctionDescriptorValue<MappedEntityValue>>
  : Check extends 'regExp'
    ? EntityDescriptor<Check, RegExp>
    : Check extends CompareWithDescriptorValueCheckMode
      ? EntityDescriptor<Check, MappedEntityValue>
      : Check extends CheckActualValueCheckMode
        ? EntityDescriptor<Check>
        : never;

export type MappedEntity = Record<string, MappedEntityDescriptor | MappedEntityValue>;

export type MappedEntitiesDescriptor<Check extends EntitiesCheckMode = EntitiesCheckMode> =
  Check extends 'every'
    ? EntitiesDescriptor<Check, MappedEntity>
    : Check extends 'some'
      ? EntitiesDescriptor<Check, MappedEntity>
      : never;

// TODO: rename this and other object entity to entities
export type MappedEntities = MappedEntitiesDescriptor | MappedEntity;

/* ----- Entity handlers ----- */

export type NonSymbolEntries<T> = [string, T[keyof T]][];