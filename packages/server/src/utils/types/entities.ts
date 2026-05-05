import type { IS_COMPARATOR_SYMBOL } from '@/utils/constants';

export type Comparator<Actual = unknown, Expected = unknown> = ((
  actual: Actual,
  expected: Expected
) => boolean) & {
  [IS_COMPARATOR_SYMBOL]: true;
};

type MappedEntityValue = boolean | number | string | (boolean | number | string)[];
type MappedEntityObject = Record<string, Comparator<MappedEntityValue> | MappedEntityValue>;
export type MappedEntity = Comparator<MappedEntityObject> | MappedEntityObject;

type BodyEntityValue = string | Record<string, unknown> | unknown[];
export type BodyEntity = BodyEntityValue | Comparator<BodyEntityValue>;

type VariablesEntityValue = Record<string, unknown>;
export type VariablesEntity = Comparator<VariablesEntityValue> | VariablesEntityValue;
