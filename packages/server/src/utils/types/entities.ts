import type { FnComparator } from '@/utils/helpers';

type AnyValue = boolean | number | object | string | symbol | null | undefined;

type ValueOrComparator<ActualValue = unknown> = AnyValue | FnComparator<ActualValue>;

export type MappedEntity<ActualValue = unknown> =
  | FnComparator<ActualValue>
  | Record<string, ValueOrComparator<ActualValue>>;

export type BodyEntity = ValueOrComparator;
export type VariablesEntity = MappedEntity;
