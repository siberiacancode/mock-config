import type {
  CheckActualValueCheckMode,
  CheckFunction,
  CheckMode,
  CompareWithDescriptorAnyValueCheckMode,
  CompareWithDescriptorStringValueCheckMode,
  CompareWithDescriptorValueCheckMode,
  EntityDescriptor
} from './checkModes';
import type { NestedObjectOrArray } from './utils';

/* ----- Plain entity ----- */

type PlainEntityPrimitiveValue = boolean | number | string | null;
type PlainEntityObjectiveValue = NestedObjectOrArray<PlainEntityPrimitiveValue>;

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

type PropertyLevelPlainEntityDescriptor<Check extends CheckMode = CheckMode> =
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

type WithoutCheckMode<T extends object> = T & { checkMode?: never };

type TopLevelPlainEntityRecord = WithoutCheckMode<
  Record<
    string,
    | PlainEntityPrimitiveValue
    | PropertyLevelPlainEntityDescriptor
    | WithoutCheckMode<PlainEntityObjectiveValue>
  >
>;

export type TopLevelPlainEntityArray = Array<PlainEntityObjectiveValue | PlainEntityPrimitiveValue>;

export type BodyPlainEntity =
  | TopLevelPlainEntityArray
  | TopLevelPlainEntityDescriptor
  | TopLevelPlainEntityRecord;

export type VariablesPlainEntity = TopLevelPlainEntityDescriptor | TopLevelPlainEntityRecord;

/* ----- Mapped entity ----- */

type MappedEntityValue = boolean | number | string;

type MappedEntityDescriptor<Check extends CheckMode = CheckMode> = Check extends 'function'
  ? EntityDescriptor<Check, EntityFunctionDescriptorValue<MappedEntityValue>>
  : Check extends 'regExp'
    ? EntityDescriptor<Check, RegExp>
    : Check extends CompareWithDescriptorValueCheckMode
      ? EntityDescriptor<Check, MappedEntityValue>
      : Check extends CheckActualValueCheckMode
        ? EntityDescriptor<Check>
        : never;

export type MappedEntity = Record<string, MappedEntityDescriptor | MappedEntityValue>;
